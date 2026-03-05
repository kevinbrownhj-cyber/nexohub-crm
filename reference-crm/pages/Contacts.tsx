import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Contact } from '../types';
import { Mail, Phone, Building2, MoreHorizontal, Plus, Search, Sparkles, X } from 'lucide-react';
import { generateEmailDraft } from '../services/geminiService';

const Contacts = () => {
  const { contacts, addContact } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailContext, setEmailContext] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDraftEmail = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEmailModalOpen(true);
    setGeneratedEmail('');
    setEmailContext('');
  };

  const generate = async () => {
    if (!selectedContact) return;
    setIsGenerating(true);
    const draft = await generateEmailDraft(selectedContact, emailContext);
    setGeneratedEmail(draft);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Usuarios</h2>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto justify-center">
            <Plus size={18} />
            <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
            type="text" 
            placeholder="Buscar por nombre o empresa..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Nombre</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Rol & Empresa</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 text-sm hidden md:table-cell">Contacto</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 text-sm hidden lg:table-cell">Último Contacto</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredContacts.map(contact => (
                        <tr key={contact.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div className="font-medium text-slate-800">{contact.name}</div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-700">{contact.role}</span>
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <Building2 size={12} /> {contact.company}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                                <div className="flex flex-col gap-1 text-sm text-slate-600">
                                    <div className="flex items-center gap-2"><Mail size={14} /> {contact.email}</div>
                                    <div className="flex items-center gap-2"><Phone size={14} /> {contact.phone}</div>
                                </div>
                            </td>
                            <td className="px-6 py-4 hidden lg:table-cell text-sm text-slate-500">
                                {contact.lastContacted}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleDraftEmail(contact)}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg tooltip"
                                        title="Redactar Email con IA"
                                    >
                                        <Sparkles size={18} />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {filteredContacts.length === 0 && (
            <div className="p-8 text-center text-slate-500">
                No se encontraron usuarios.
            </div>
        )}
      </div>

      {/* AI Email Modal */}
      {isEmailModalOpen && selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                         <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Sparkles size={20} />
                         </div>
                         <div>
                             <h3 className="font-bold text-slate-800">Redactor Inteligente</h3>
                             <p className="text-xs text-slate-500">Para: {selectedContact.name}</p>
                         </div>
                    </div>
                    <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">¿Sobre qué quieres escribir?</label>
                        <textarea 
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[80px]"
                            placeholder="Ej: Invitación a demo del producto para el próximo martes..."
                            value={emailContext}
                            onChange={(e) => setEmailContext(e.target.value)}
                        />
                    </div>

                    {generatedEmail && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                             <label className="block text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wide">Borrador Generado</label>
                             <textarea 
                                className="w-full bg-transparent border-0 p-0 text-slate-700 text-sm focus:ring-0 min-h-[200px]"
                                value={generatedEmail}
                                readOnly
                             />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsEmailModalOpen(false)}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={generate}
                        disabled={!emailContext || isGenerating}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isGenerating ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                Generando...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Generar Borrador
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;