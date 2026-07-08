import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../config/supabaseClient'

const AuthContext = createContext(null)

const ROLE_TO_USER_TYPE = {
  client: 'cliente',
  company: 'empresa',
  provider: 'prestador',
  admin: 'admin'
}

const formatPhoneForAuth = (phoneStr) => {
  if (!phoneStr) return null;
  const clean = phoneStr.replace(/\D/g, '');
  if (clean.startsWith('244') && clean.length === 12) {
    return '+' + clean;
  }
  if (clean.length === 9) {
    return '+244' + clean;
  }
  return '+' + clean;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchedUserIdRefs = useRef(null)

  const userType = useMemo(
    () => (user?.role ? ROLE_TO_USER_TYPE[user.role] ?? null : null),
    [user?.role]
  )

  useEffect(() => {
    let isMounted = true;

    // 1. Get initial session
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          if (error.message.includes('Refresh Token')) {
            // Corrupted session, clear it locally
            await supabase.auth.signOut().catch(() => {})
            localStorage.clear()
          }
          throw error
        }
        
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email)
        } else if (isMounted) {
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Erro ao buscar sessão:', err)
          setLoading(false)
        }
      }
    }

    initSession()

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (session?.user) {
        // Only fetch if profile for this user has not been fetched yet
        if (fetchedUserIdRefs.current !== session.user.id) {
           await fetchProfile(session.user.id, session.user.email)
        }
      } else {
        fetchedUserIdRefs.current = null;
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false;
      subscription?.unsubscribe()
    }
  }, []) // empty deps array keeps this running only once

  const fetchProfile = async (userId, userEmail = '') => {
    try {
      fetchedUserIdRefs.current = userId; // Mark as fetched/fetching to block double requests
      const { data, error } = await supabase
        .from('profiles')
        .select('*, nifs(nif)')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) throw error
      
      if (data) {
        // Normalize role to prevent issues with trailing spaces or capitalization
        if (data.role) {
          data.role = data.role.trim().toLowerCase();
        }

        // Check if we have a pending profile saved locally (e.g. from a failed RLS upsert during signup)
        const pendingStr = localStorage.getItem('pending_mimu_profile');
        if (pendingStr) {
           try {
              const pendingProfile = JSON.parse(pendingStr);
              // If the local profile is for this user and has more specific data (like a different role)
              if (pendingProfile.id === userId && (data.role === 'client' && pendingProfile.role !== 'client')) {
                 // We have a session now, let's sync the pending data to the database
                 const mergedProfile = { ...data, ...pendingProfile };
                 const { data: newDbData, error: upsertError } = await supabase.from('profiles').upsert(mergedProfile).select().single();
                 if (!upsertError && newDbData) {
                    setUser({ auth_id: userId, ...newDbData });
                    localStorage.removeItem('pending_mimu_profile');
                    setLoading(false);
                    return;
                 }
              } else if (pendingProfile.id === userId) {
                 // If it's just other data, or role is already correct, clear it or sync if needed.
                 // For now, if role is correct, just remove it to avoid endless attempts.
                 if (data.role === pendingProfile.role) {
                    localStorage.removeItem('pending_mimu_profile');
                 }
              }
           } catch {
              // ignore
           }
        }
        
        const nifValue = data.nifs ? (Array.isArray(data.nifs) ? data.nifs[0]?.nif : data.nifs?.nif) : null;
        delete data.nifs;
        setUser({ auth_id: userId, ...data, nif: nifValue })
      } else {
        // Tentar recuperar perfil guardado localmente caso não exista de todo
        const pendingStr = localStorage.getItem('pending_mimu_profile');
        if (pendingStr) {
           try {
              const pendingProfile = JSON.parse(pendingStr);
              if (pendingProfile.id === userId) {
                 const { data: newDbData, error: upsertError } = await supabase.from('profiles').upsert(pendingProfile).select().single();
                 if (!upsertError && newDbData) {
                    setUser({ auth_id: userId, ...newDbData });
                    localStorage.removeItem('pending_mimu_profile');
                    setLoading(false);
                    return;
                 }
              }
           } catch {
              // ignore
           }
        }

        // Se falhar a recuperação, devolve os dados básicos em vez de anular o utilizador ("ghost state")
        // O utilizador será levado pelo dashboard correspondente à sua função caso haja fallback, senão assumimos role default
        setUser({ 
           auth_id: userId, 
           id: userId, 
           email: userEmail, 
           role: 'client', // Default fallback para impedir paragem completa
           status: 'active'  // Clientes têm sempre acesso direto
        })
        fetchedUserIdRefs.current = null; 
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err)
      setUser(null)
      fetchedUserIdRefs.current = null;
    } finally {
      setLoading(false)
    }
  }

  // --- LOGIN VIA SUPABASE AUTH ---
  const login = async (emailOrPhone, password) => {
    try {
      let loginEmail = emailOrPhone.trim();
      const cleanPhone = loginEmail.replace(/\D/g, '');
      const isPhone = !loginEmail.includes('@') && cleanPhone.length >= 9 && cleanPhone.length <= 15;
      
      const payload = { password };
      if (isPhone) {
        payload.phone = formatPhoneForAuth(cleanPhone);
      } else {
        payload.email = loginEmail;
      }

      const { data, error } = await supabase.auth.signInWithPassword(payload)

      if (error) {
        if (error.message.includes('Email not confirmed') || error.message.includes('Phone not confirmed')) {
          return { 
            success: false, 
            error: isPhone 
              ? 'Por favor, confirme a sua conta através do código enviado por SMS para o seu telemóvel.' 
              : 'Por favor, confirme a sua conta através do link enviado para o seu e-mail antes de entrar.' 
          }
        }
        return { success: false, error: isPhone ? 'Telefone ou palavra-passe incorretos.' : 'E-mail ou palavra-passe incorretos.' }
      }
      
      // onAuthStateChange vai lidar com o setUser
      return { success: true, user: data.user }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // --- PASSWORD CHANGE ---
  const changePassword = async (email, currentPassword, newPassword) => {
    try {
      // 1. Verify current credentials
      const { error: checkError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword
      })
      
      if (checkError) {
        return { success: false, error: 'As credenciais atuais (e-mail ou palavra-passe) estão incorretas.' }
      }

      // 2. Perform the update
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
         return { success: false, error: updateError.message }
      }
      
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // --- UPLOAD HELPERS ---
  const uploadFile = async (bucket, path, file) => {
    let fileToUpload = file;
    if (file.type && file.type.startsWith('image/')) {
      try {
        const imageCompression = (await import('browser-image-compression')).default;
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        fileToUpload = await imageCompression(file, options);
      } catch (err) {
        console.warn('Compression failed, using original file', err);
      }
    }

    const { error } = await supabase.storage.from(bucket).upload(path, fileToUpload, {
      upsert: true
    })
    if (error) throw error
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)
    return publicData.publicUrl
  }

  const uploadDocuments = async (userId, documents) => {
    if (!documents) return {}
    const urls = {}
    const uploadTasks = []
    
    for (const [key, fileOrFiles] of Object.entries(documents)) {
      if (Array.isArray(fileOrFiles)) {
        urls[key] = []
        for (let i = 0; i < fileOrFiles.length; i++) {
          const file = fileOrFiles[i]
          const ext = file.name.split('.').pop()
          const path = `${userId}/${key}_${i}_${Date.now()}.${ext}`
          uploadTasks.push(
            uploadFile('documents', path, file).then(url => {
               urls[key][i] = url
            })
          )
        }
      } else {
        const file = fileOrFiles
        if (!file) continue
        const ext = file.name.split('.').pop()
        const path = `${userId}/${key}_${Date.now()}.${ext}`
        
        const bucket = (key === 'logo' || key === 'photo') ? 'avatars' : 'documents'
        uploadTasks.push(
            uploadFile(bucket, path, file).then(url => {
               urls[key] = url
            })
        )
      }
    }
    
    await Promise.all(uploadTasks)
    return urls
  }

  // --- DIRECT SUPABASE AUTH REGISTRATION ---
  const baseRegister = async ({ email, phone, password, role, ...profileData }) => {
    try {
      const cleanEmailPhone = email.trim();
      const cleanPhone = phone ? phone.replace(/\D/g, '') : (cleanEmailPhone.includes('@') ? null : cleanEmailPhone.replace(/\D/g, ''));
      const isPhoneSignup = !cleanEmailPhone.includes('@') && cleanPhone && cleanPhone.length >= 9;

      const authPayload = { password };
      if (isPhoneSignup) {
        authPayload.phone = formatPhoneForAuth(cleanPhone);
      } else {
        authPayload.email = cleanEmailPhone;
      }

      // 1. Sign up on Supabase Auth
      let { data: authData, error: authError } = await supabase.auth.signUp(authPayload)

      if (authError) {
        console.error("Auth Error:", authError)
        return { success: false, error: authError.message }
      }

      if (!authData || !authData.user) {
        return { success: false, error: isPhoneSignup ? 'Ocorreu um erro ou este número de telefone já está em uso na plataforma.' : 'Ocorreu um erro ou este e-mail já está em uso na plataforma. Tente recuperar a palavra-passe ou usar outro e-mail.' }
      }

      // Se for registo por telefone, forçar login para obter a sessão ativa imediatamente
      let activeSession = authData.session;
      if (isPhoneSignup && !activeSession) {
        try {
          const { data: loginData } = await supabase.auth.signInWithPassword(authPayload);
          if (loginData?.session) {
            activeSession = loginData.session;
            authData = { ...authData, session: loginData.session };
          }
        } catch (err) {
          console.warn("Falha ao forçar login automático de telefone:", err);
        }
      }

      const authUserId = authData.user.id

      // 2. Upload documents returning URL
      let document_urls = {}
      let avatar_url = null
      let logo_url = null

      if (profileData.documents) {
        document_urls = await uploadDocuments(authUserId, profileData.documents)
        
        if (document_urls.photo) {
          avatar_url = document_urls.photo
          delete document_urls.photo
        }
        if (document_urls.logo) {
          logo_url = document_urls.logo
          delete document_urls.logo
        }
        if (document_urls.photoOrLogo) {
          avatar_url = document_urls.photoOrLogo
          delete document_urls.photoOrLogo
        }
      }

      delete profileData.documents

      // 3. Resolve Location Names for backward compatibility while saving IDs
      let provinceName = profileData.province;
      let cityName = profileData.city;
      
      // If province is a UUID (meaning it came from the new dynamic select)
      if (profileData.province && profileData.province.length > 30) {
         const { data: pData } = await supabase.from('provinces').select('name').eq('id', profileData.province).maybeSingle();
         if (pData) provinceName = pData.name;
      }
      // If city is a UUID
      if (profileData.city && profileData.city.length > 30) {
         const { data: mData } = await supabase.from('municipalities').select('name').eq('id', profileData.city).maybeSingle();
         if (mData) cityName = mData.name;
      }

      const nifValue = profileData.nif;
      delete profileData.nif;

      const newProfile = {
        id: authUserId,
        role,
        email: isPhoneSignup ? null : cleanEmailPhone,
        phone: cleanPhone || null,
        status: role === 'client' ? 'active' : 'pending_approval',
        avatar_url,
        logo_url,
        document_urls: Object.keys(document_urls).length > 0 ? document_urls : null,
        ...profileData,
        province_id: profileData.province?.length > 30 ? profileData.province : null,
        municipality_id: profileData.city?.length > 30 ? profileData.city : null,
        category_id: profileData.category_id || null,
        province: provinceName,
        city: cityName
      }

      // Guardar o perfil localmente em cache para caso a inserção falhe devido a RLS anonimo
      localStorage.setItem('pending_mimu_profile', JSON.stringify(newProfile));

      // Insert (or upsert if trigger already created the row) 
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(newProfile)

      if (!profileError && nifValue) {
         const { error: nifError } = await supabase
           .from('nifs')
           .upsert({ user_id: authUserId, tipo_conta: role, nif: nifValue }, { onConflict: 'user_id' });
         if (nifError) console.warn("Erro ao salvar NIF:", nifError);
      }

      // Se a sessão estiver ativa (confirmação por email desativada), limpar cache se salvou bem
      if (!profileError && activeSession) {
          localStorage.removeItem('pending_mimu_profile');
      }

      if (profileError) {
        console.warn("Profile Warning (Non-Blocking - Saved to LocalStorage):", profileError)
      }
      
      // Retornar indicativo visual de que precisa de confirmacao (sessao ficaria nulo e o utilizador nulo ou n logado completamente)
      const requireEmailConfirmation = !activeSession;

      return { success: true, requireEmailConfirmation, user: authData.user }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const registerClient = async (data) => {
    return baseRegister({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: 'client'
    })
  }

  const registerCompany = async (data) => {
    return baseRegister({
      company_name: data.companyName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      province: data.province,
      city: data.city,
      description: data.description,
      category_id: data.categoryId,
      service_types: data.serviceTypes,
      hours: data.hours,
      documents: data.documents,
      nif: data.nif,
      role: 'company'
    })
  }

  const registerProvider = async (data) => {
    return baseRegister({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      description: data.description,
      province: data.province,
      city: data.city,
      category_id: data.categoryId,
      service_types: data.serviceTypes,
      hours: data.hours,
      documents: data.documents,
      nif: data.nif,
      role: 'provider'
    })
  }

  const updateUser = async (updates) => {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      setUser(prev => ({ ...prev, ...updates }))
    }
  }

  const updateProfile = async (payloadOrFormData) => {
    if (!user) return { success: false, error: 'Não autenticado' }

    try {
      let updates = payloadOrFormData instanceof FormData 
        ? Object.fromEntries(payloadOrFormData.entries()) 
        : { ...payloadOrFormData }

      if (updates.photo instanceof File) {
        if (user.avatar_url) {
          const oldPath = user.avatar_url.split('/avatars/').pop()
          if (oldPath) await supabase.storage.from('avatars').remove([oldPath])
        }
        const ext = updates.photo.name.split('.').pop()
        const path = `${user.id}/avatar_${Date.now()}.${ext}`
        updates.avatar_url = await uploadFile('avatars', path, updates.photo)
        delete updates.photo
      } else if (updates.photo === '' || updates.photo === undefined) {
          delete updates.photo
      }

      if (updates.logo instanceof File) {
        if (user.logo_url) {
          const oldPath = user.logo_url.split('/avatars/').pop()
          if (oldPath) await supabase.storage.from('avatars').remove([oldPath])
        }
        const ext = updates.logo.name.split('.').pop()
        const path = `${user.id}/logo_${Date.now()}.${ext}`
        updates.logo_url = await uploadFile('avatars', path, updates.logo)
        delete updates.logo
      } else if (updates.logo === '' || updates.logo === undefined) {
         delete updates.logo
      }

      // Handle Carousel (gallery_urls)
      let currentGallery = Array.isArray(updates.existingGallery) ? [...updates.existingGallery] : (user.gallery_urls || []);
      delete updates.existingGallery;

      if (Array.isArray(updates.newGalleryFiles) && updates.newGalleryFiles.length > 0) {
        for (let i = 0; i < updates.newGalleryFiles.length; i++) {
          const file = updates.newGalleryFiles[i];
          if (file instanceof File) {
            const ext = file.name.split('.').pop()
            const path = `${user.id}/gallery_${Date.now()}_${i}.${ext}`
            const url = await uploadFile('profiles', path, file)
            currentGallery.push(url)
          }
        }
      }
      delete updates.newGalleryFiles;
      
      // Update the DB property
      updates.gallery_urls = currentGallery;

      if ('companyName' in updates) {
        updates.company_name = updates.companyName;
        delete updates.companyName;
      }

      if ('serviceTypes' in updates) {
        if (typeof updates.serviceTypes === 'string') {
          try {
            updates.service_types = JSON.parse(updates.serviceTypes)
          } catch {
            updates.service_types = updates.serviceTypes ? [updates.serviceTypes] : []
          }
        } else if (Array.isArray(updates.serviceTypes)) {
          updates.service_types = updates.serviceTypes
        }
        delete updates.serviceTypes
      }

      // Handle relational location updates
      if (updates.province && updates.province.length > 30) {
         updates.province_id = updates.province;
         const { data: pData } = await supabase.from('provinces').select('name').eq('id', updates.province).maybeSingle();
         if (pData) updates.province = pData.name;
      }
      if (updates.city && updates.city.length > 30) {
         updates.municipality_id = updates.city;
         const { data: mData } = await supabase.from('municipalities').select('name').eq('id', updates.city).maybeSingle();
         if (mData) updates.city = mData.name;
      }
      if ('categoryId' in updates) {
         updates.category_id = updates.categoryId || null;
         delete updates.categoryId;
      }

      let nifUpdateValue = undefined;
      if ('nif' in updates) {
         nifUpdateValue = updates.nif;
         delete updates.nif;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
      
      if (error) throw error

      if (nifUpdateValue !== undefined) {
         if (nifUpdateValue) {
            const { error: nifError } = await supabase
              .from('nifs')
              .upsert({ user_id: user.id, tipo_conta: user.role, nif: nifUpdateValue }, { onConflict: 'user_id' });
            if (nifError) console.error('Erro ao atualizar NIF:', nifError);
         } else {
            const { error: nifError } = await supabase.from('nifs').delete().eq('user_id', user.id);
            if (nifError) console.error('Erro ao apagar NIF:', nifError);
         }
      }

      setUser({ ...user, ...updates, ...(nifUpdateValue !== undefined ? { nif: nifUpdateValue } : {}) })
      return { success: true, user: { ...user, ...updates, ...(nifUpdateValue !== undefined ? { nif: nifUpdateValue } : {}) } }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const verifySignupOtp = async (emailOrPhone, token) => {
    try {
      const cleanInput = emailOrPhone.trim();
      const isPhone = !cleanInput.includes('@');
      const payload = { token, type: 'signup' };
      if (isPhone) {
        payload.phone = formatPhoneForAuth(cleanInput);
      } else {
        payload.email = cleanInput;
      }
      const { data, error } = await supabase.auth.verifyOtp(payload);
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  const value = {
    user: loading ? null : user,
    userType,
    login,
    logout,
    registerClient,
    registerCompany,
    registerProvider,
    updateUser,
    updateProfile,
    changePassword,
    verifySignupOtp,
    isClient: ['client', 'cliente'].includes(user?.role?.trim().toLowerCase()),
    isCompany: ['company', 'empresa'].includes(user?.role?.trim().toLowerCase()),
    isProvider: ['provider', 'prestador'].includes(user?.role?.trim().toLowerCase()),
    isAdmin: ['admin', 'administrador'].includes(user?.role?.trim().toLowerCase())
  }

  if (loading) return null

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { AuthContext }
