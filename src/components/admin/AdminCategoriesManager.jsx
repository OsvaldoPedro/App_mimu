import React, { useState } from 'react';
import { useCategoriesContext } from '../../context/CategoriesContext';
import { supabase } from '../../config/supabaseClient';
import DynamicIcon from '../common/DynamicIcon';

const CATEGORY_COLORS = [
  { id: 'amarelo', name: 'Amarelo', bg: 'bg-yellow-500/90', text: 'text-yellow-900', hex: '#EAB308', display: 'bg-yellow-500' },
  { id: 'azul', name: 'Azul', bg: 'bg-blue-500/90', text: 'text-blue-900', hex: '#3B82F6', display: 'bg-blue-500' },
  { id: 'verde', name: 'Verde', bg: 'bg-green-500/90', text: 'text-green-900', hex: '#22C55E', display: 'bg-green-500' },
  { id: 'vermelho', name: 'Vermelho', bg: 'bg-red-500/90', text: 'text-red-900', hex: '#EF4444', display: 'bg-red-500' },
  { id: 'roxo', name: 'Roxo', bg: 'bg-purple-500/90', text: 'text-purple-900', hex: '#A855F7', display: 'bg-purple-500' },
  { id: 'rosa', name: 'Rosa', bg: 'bg-pink-500/90', text: 'text-pink-900', hex: '#EC4899', display: 'bg-pink-500' },
  { id: 'laranja', name: 'Laranja', bg: 'bg-orange-500/90', text: 'text-orange-900', hex: '#F97316', display: 'bg-orange-500' },
  { id: 'escuro', name: 'Escuro/Cinza', bg: 'bg-gray-800/90', text: 'text-white', hex: '#1F2937', display: 'bg-gray-800' },
];

const AVAILABLE_ICONS = [
  'PartyPopper', 'Car', 'Utensils', 'Scissors', 'Home', 'Camera', 'Music', 'Laptop', 'Truck', 'Bus',
  'Plane', 'Gift', 'Heart', 'Star', 'Coffee', 'Wine', 'Dumbbell', 'Stethoscope', 'Briefcase', 'GraduationCap',
  'Baby', 'Dog', 'Paintbrush', 'Hammer', 'Wrench', 'Smartphone', 'Video', 'Mic', 'Calendar', 'MapPin',
  'Sparkles', 'Shield', 'ShoppingBag', 'Ticket', 'ScissorsSquare'
];

export default function AdminCategoriesManager() {
  const { categories, loading } = useCategoriesContext();
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({});
  const [newService, setNewService] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleEditClick = (cat) => {
    if (editingCategory === cat.id) {
      setEditingCategory(null);
    } else {
      setEditingCategory(cat.id);
      
      // Attempt to map the current db values to our visual presets
      let matchedColor = CATEGORY_COLORS.find(c => c.hex === cat.color || c.bg === cat.bgClass);
      
      setFormData({
        name: cat.name,
        icon: cat.icon,
        bg_class: cat.bgClass,
        text_class: cat.textClass,
        color: cat.color,
        is_active: cat.isActive,
        _matchedColorId: matchedColor ? matchedColor.id : null // Internal state for UI selection
      });
      setShowIconPicker(false);
    }
  };

  const handleColorSelect = (colorPreset) => {
    setFormData(prev => ({
      ...prev,
      bg_class: colorPreset.bg,
      text_class: colorPreset.text,
      color: colorPreset.hex,
      _matchedColorId: colorPreset.id
    }));
  };

  const handleIconSelect = (iconName) => {
    setFormData(prev => ({
      ...prev,
      icon: iconName
    }));
    setShowIconPicker(false);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveCategory = async (catId) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name,
          icon: formData.icon,
          bg_class: formData.bg_class,
          text_class: formData.text_class,
          color: formData.color,
          is_active: formData.is_active,
        })
        .eq('id', catId);

      if (error) throw error;
      alert('Categoria atualizada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar categoria: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddService = async (catId) => {
    if (!newService.trim()) return;
    try {
      const { error } = await supabase
        .from('category_services')
        .insert({
          category_id: catId,
          name: newService.trim()
        });

      if (error) throw error;
      setNewService('');
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar serviço: ' + err.message);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Tens a certeza que queres remover este serviço?')) return;
    try {
      const { error } = await supabase
        .from('category_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert('Erro ao apagar serviço: ' + err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-mimu-wine-light-text dark:text-gray-300">A carregar categorias...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-mimu-cream dark:bg-[#121212]/30 p-6 rounded-2xl border border-mimu-cream-border dark:border-[#2A2A2A] mb-6 shadow-sm">
        <h3 className="font-bold text-mimu-wine-text dark:text-white text-xl mb-2">Gestor de Categorias e Serviços</h3>
        <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80 max-w-3xl">
          As alterações feitas aqui são propagadas em tempo real para todos os utilizadores da aplicação. Personaliza visualmente cada categoria de forma simples e rápida.
        </p>
      </div>

      <div className="grid gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-mimu-white dark:bg-[#1E1E1E] border border-mimu-cream-border dark:border-[#2A2A2A] rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
            {/* Category Header */}
            <div
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-mimu-gray-50 dark:hover:bg-[#121212]/80 transition-colors"
              onClick={() => handleEditClick(cat)}
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 flex items-center justify-center rounded-2xl text-2xl shadow-sm ${cat.bgClass} ${cat.textClass}`}>
                  <DynamicIcon name={cat.icon} className="w-7 h-7 text-current" />
                </div>
                <div>
                  <h4 className="font-bold text-mimu-wine-text dark:text-white text-lg leading-tight mb-1">{cat.name}</h4>
                  <p className="text-xs font-medium text-mimu-wine-light-text/80 dark:text-gray-400">
                    {cat.services?.length || 0} serviços • <span className={cat.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>{cat.isActive ? 'Ativa' : 'Inativa'}</span>
                  </p>
                </div>
              </div>
              <div>
                <button className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${editingCategory === cat.id ? 'bg-mimu-wine/10 text-mimu-wine dark:bg-white/10 dark:text-white' : 'text-mimu-gold hover:bg-mimu-gold/10'}`}>
                  {editingCategory === cat.id ? 'Fechar Edição' : 'Personalizar'}
                </button>
              </div>
            </div>

            {/* Editor de Categoria Premium */}
            {editingCategory === cat.id && (
              <div className="p-6 border-t border-mimu-cream-border dark:border-[#2A2A2A] bg-gray-50/50 dark:bg-[#121212]/30">
                
                {/* Real-time Preview Section */}
                <div className="mb-8 p-6 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#333] shadow-sm">
                  <h5 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-4 tracking-wider">Preview em tempo real</h5>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 flex items-center justify-center rounded-2xl shadow-md transition-all duration-300 ${formData.bg_class} ${formData.text_class}`}>
                       <DynamicIcon name={formData.icon} className="w-8 h-8 text-current" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-mimu-wine-text dark:text-white">{formData.name || 'Nova Categoria'}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Será exibida com este visual na aplicação</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Esquerda: Informação Básica */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-mimu-wine-text dark:text-gray-200 mb-2">Nome da Categoria</label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-mimu-gold focus:border-transparent outline-none transition-all dark:text-white"
                        placeholder="Ex: Festas & Eventos"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-mimu-wine-text dark:text-gray-200 mb-2">Ícone Visual</label>
                      
                      {!showIconPicker ? (
                        <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-xl">
                          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-[#2A2A2A] rounded-lg">
                            <DynamicIcon name={formData.icon} className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                          </div>
                          <span className="flex-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                            {AVAILABLE_ICONS.includes(formData.icon) ? formData.icon : (formData.icon || 'Nenhum ícone')}
                          </span>
                          <button 
                            onClick={() => setShowIconPicker(true)}
                            className="px-4 py-2 text-sm font-bold text-mimu-gold bg-mimu-gold/10 hover:bg-mimu-gold/20 rounded-lg transition-colors"
                          >
                            Alterar Ícone
                          </button>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] p-4 rounded-xl shadow-inner">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-gray-500 uppercase">Selecione um ícone</span>
                            <button onClick={() => setShowIconPicker(false)} className="text-gray-400 hover:text-gray-600">Fechar</button>
                          </div>
                          <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {AVAILABLE_ICONS.map(icon => (
                              <button
                                key={icon}
                                onClick={() => handleIconSelect(icon)}
                                className={`p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors ${formData.icon === icon ? 'ring-2 ring-mimu-gold bg-mimu-gold/5' : ''}`}
                                title={icon}
                              >
                                <DynamicIcon name={icon} className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                              </button>
                            ))}
                          </div>
                          {/* Fallback support for emojis */}
                          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#333]">
                            <label className="block text-xs font-medium text-gray-500 mb-2">Ou insira um Emoji personalizado:</label>
                            <input
                              name="icon"
                              value={formData.icon}
                              onChange={handleFormChange}
                              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#444] rounded-lg text-sm"
                              placeholder="Ex: 🎉"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center pt-2">
                      <label className="flex items-center cursor-pointer group">
                        <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${formData.is_active ? 'bg-mimu-gold' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${formData.is_active ? 'translate-x-6' : ''}`}></div>
                        </div>
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleFormChange}
                          className="hidden"
                        />
                        <span className="ml-3 text-sm font-bold text-mimu-wine-text dark:text-white group-hover:text-mimu-gold transition-colors">Categoria Ativa ao Público</span>
                      </label>
                    </div>
                  </div>

                  {/* Direita: Seleção de Cor */}
                  <div>
                    <label className="block text-sm font-bold text-mimu-wine-text dark:text-gray-200 mb-4">Selecionar Cor da Categoria</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {CATEGORY_COLORS.map(colorPreset => (
                        <button
                          key={colorPreset.id}
                          onClick={() => handleColorSelect(colorPreset)}
                          className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 group ${formData._matchedColorId === colorPreset.id ? 'border-mimu-gold shadow-md bg-white dark:bg-[#1A1A1A] scale-[1.02]' : 'border-transparent hover:border-gray-200 dark:hover:border-[#333] hover:bg-white dark:hover:bg-[#1A1A1A]'}`}
                        >
                          <div className={`w-10 h-10 rounded-full mb-2 shadow-sm ${colorPreset.display}`}></div>
                          <span className={`text-xs font-semibold ${formData._matchedColorId === colorPreset.id ? 'text-mimu-gold' : 'text-gray-500 dark:text-gray-400'}`}>
                            {colorPreset.name}
                          </span>
                          
                          {formData._matchedColorId === colorPreset.id && (
                            <div className="absolute top-2 right-2 w-4 h-4 bg-mimu-gold rounded-full flex items-center justify-center shadow-sm">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {!formData._matchedColorId && formData.color && (
                       <p className="mt-4 text-xs text-orange-500 font-medium p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          Esta categoria utiliza uma cor antiga personalizada. Ao selecionares uma cor acima, irás migrá-la para o novo sistema visual.
                       </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mb-8 pt-6 border-t border-gray-100 dark:border-[#333]">
                  <button
                    onClick={() => handleSaveCategory(cat.id)}
                    disabled={isSaving}
                    className="px-6 py-3 bg-mimu-gold text-mimu-wine-text font-bold rounded-xl hover:bg-[#b87d26] hover:scale-105 transition-all shadow-lg shadow-mimu-gold/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-mimu-wine-text" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        A Guardar...
                      </>
                    ) : 'Guardar Alterações da Categoria'}
                  </button>
                </div>

                {/* Gestão de Serviços Integrada */}
                <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-gray-100 dark:border-[#333]">
                  <h5 className="font-bold text-mimu-wine-text dark:text-white mb-1 text-lg">Serviços da Categoria</h5>
                  <p className="text-xs text-gray-500 mb-5">Adiciona ou remove serviços que farão parte deste grupo ({cat.raw_services?.length || 0} totais).</p>

                  <div className="flex gap-3 mb-6">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                      </div>
                      <input
                        value={newService}
                        onChange={e => setNewService(e.target.value)}
                        placeholder="Nome do novo serviço (ex: Limpeza Geral)"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#444] rounded-xl focus:ring-2 focus:ring-mimu-gold outline-none transition-all dark:text-white text-sm"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddService(cat.id) }}
                      />
                    </div>
                    <button
                      onClick={() => handleAddService(cat.id)}
                      className="px-5 py-3 bg-mimu-wine dark:bg-[#2A2A2A] text-white font-bold rounded-xl hover:bg-mimu-wine/90 dark:hover:bg-[#333] transition-colors whitespace-nowrap text-sm"
                    >
                      Adicionar
                    </button>
                  </div>

                  {cat.raw_services && cat.raw_services.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {cat.raw_services.map((svc, idx) => {
                        const isObj = typeof svc === 'object' && svc !== null;
                        const svcId = isObj ? svc.id : `temp-${idx}`;
                        const svcName = isObj ? svc.name : svc;
                        return (
                          <div key={svcId} className="flex items-center justify-between group bg-gray-50 dark:bg-[#222] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] border border-gray-100 dark:border-[#333] p-3 rounded-xl transition-colors">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate pr-2">{svcName}</span>
                            {isObj && svc.id ? (
                              <button
                                onClick={() => handleDeleteService(svc.id)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Apagar Serviço"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-gray-50 dark:bg-[#222] rounded-xl border border-dashed border-gray-200 dark:border-[#444]">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                      <p className="text-sm text-gray-500 font-medium">Nenhum serviço registado nesta categoria.</p>
                      <p className="text-xs text-gray-400 mt-1">Usa o campo acima para criar as primeiras opções.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
