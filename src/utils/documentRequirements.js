export const getRequiredDocuments = (categoryId, serviceTypes = [], role = 'provider') => {
  // Base docs depending on role
  const photoDoc = role === 'company' ? (['estadia', 'comer'].includes(categoryId) ? 'logo' : 'photoOrLogo') : 'photo';

  // Start with default required
  let required = ['identidad', photoDoc];
  let optional = [];

  // Conditional logic per category and services
  if (categoryId === 'estadia') {
    required.push('establishment');
  }

  if (categoryId === 'comer') {
    // Restaurante & Bar logic
    required.push('establishment');
  }

  if (categoryId === 'festas') {
    // Default handles it
  }

  if (categoryId === 'transporte') {
    if (serviceTypes.includes('Táxi') || serviceTypes.includes('Moto-táxi')) {
      required.push('drivinglicense');
    }
    if (serviceTypes.includes('Agência de viagens')) {
      required.push('establishment', 'touristlicense', 'identidad');
      optional.push('addressproof');
    }
  }

  if (categoryId === 'beleza') {
    if (serviceTypes.includes('Clínicas') || serviceTypes.includes('Postos médicos')) {
      required.push('establishment', 'certificates');
    }
    // Profissional de Saúde logic
    if (serviceTypes.some(s => ['Profissionais de Saúde', 'Clínicas', 'Postos médicos'].includes(s))) {
      required.push('cv');
    }
  }

  if (categoryId === 'casa') {
    // Empregada Doméstica & Limpeza & Outros serviços da Casa
    required.push('cv');
    optional.push('establishment');
  }

  if (categoryId === 'automovel') {
    // Default handles it
  }

  if (categoryId === 'entregas') {
    optional.push('drivinglicense');
  }

  if (categoryId === 'profissionais') {
    required.push('certificates');
  }

  if (categoryId === 'formacao') {
    // Formação & Capacitação logic
    required.push('cv');
    optional.push('establishment');
  }

  // Deduplicate and return
  return {
    required: [...new Set(required)],
    optional: [...new Set(optional)]
  };
};

export const getDocumentConfig = (docType, categoryId, serviceTypes = [], _role = 'provider') => {
  const isMultiple = docType === 'certificates';
  const isPhoto = ['photo', 'photoOrLogo', 'logo'].includes(docType);

  let label = 'Documento';
  let description = '';
  let buttonText = 'Carregar documento';

  // Base configurations
  if (docType === 'identidad') {
    label = 'Carregar Bilhete de Identidade';
    description = 'Cópia digitalizada frente e verso do seu BI.';
    buttonText = 'Carregar documento';
  } else if (docType === 'logo') {
    label = 'Logotipo do negócio';
    description = 'Uma imagem clara do seu logotipo comercial.';
    buttonText = 'Adicionar imagem';
  } else if (docType === 'photoOrLogo') {
    label = 'Logotipo ou foto do negócio';
    description = 'Uma imagem clara para apresentar o seu perfil aos clientes.';
    buttonText = 'Adicionar imagem';
  } else if (docType === 'photo') {
    label = 'Foto do rosto do prestador';
    description = 'Uma foto de rosto clara e profissional para o seu perfil.';
    buttonText = 'Adicionar imagem';
  } else if (docType === 'certificates') {
    label = 'Certificados profissionais';
    description = 'Adicione diplomas ou certificados relevantes. (Pode selecionar vários)';
    buttonText = 'Adicionar certificados';
  } else if (docType === 'drivinglicense') {
    label = 'Carregar Carta de Condução';
    description = 'Cópia digitalizada frente e verso da sua carta de condução válida.';
    buttonText = 'Carregar documento';
  } else if (docType === 'establishment') {
    label = 'Documento da empresa';
    description = 'Documento comprovativo do estabelecimento (se aplicável).';
    buttonText = 'Carregar documento';
  } else if (docType === 'cv') {
    label = 'Currículo (CV)';
    description = 'Adicione o seu currículo detalhado.';
    buttonText = 'Adicionar currículo';
  } else if (docType === 'touristlicense') {
    label = 'Licença de atividade turística';
    description = 'Documento emitido pelas autoridades que autoriza o funcionamento da agência.';
    buttonText = 'Carregar documento';
  } else if (docType === 'addressproof') {
    label = 'Comprovativo de endereço';
    description = 'Ex: contrato de arrendamento, conta de energia ou água.';
    buttonText = 'Carregar documento';
  }

  // Dynamic overrides based on specific categories/services
  if (docType === 'cv') {
    if (categoryId === 'casa') {
      description = 'Adicione o seu currículo com experiência nas áreas de serviço.';
    } else if (categoryId === 'formacao') {
      description = 'Inclua sua experiência e qualificações como formador.';
    } else if (categoryId === 'beleza' && serviceTypes.some(s => ['Profissionais de Saúde', 'Clínicas', 'Postos médicos'].includes(s))) {
      description = 'Obrigatório: inclua formação e experiência na área da saúde.';
    }
  }

  if (docType === 'establishment') {
    if (categoryId === 'casa') {
      description = 'Se é ou representa uma instituição, adicione o documento (alvará, licença ou registo comercial).';
    } else if (categoryId === 'formacao') {
      description = 'Se é uma Instituição ou representa uma, adicione o documento.';
    } else if (categoryId === 'comer') {
      description = 'Obrigatório: licença, alvará ou registo comercial.';
    } else if (categoryId === 'transporte' && serviceTypes.includes('Agência de viagens')) {
      label = 'Documento legal da empresa';
      description = 'Obrigatório: anexe o alvará, licença ou registo comercial válido.';
    }
  }

  if (docType === 'identidad') {
    if (categoryId === 'transporte' && serviceTypes.includes('Agência de viagens')) {
      label = 'Documento de identificação do responsável';
      description = 'Bilhete de Identidade do responsável legal da empresa.';
    }
  }

  return {
    label,
    description,
    buttonText,
    isMultiple,
    isPhoto
  };
};
