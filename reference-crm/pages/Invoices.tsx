import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, FileText, Check, MinusCircle, X, MoreHorizontal, Upload, Loader2, FileSpreadsheet, Pencil, Calendar, Download, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { processInvoiceFile } from '../services/geminiService';
import { useNotification } from '../context/NotificationContext';
import { utils, writeFile } from 'xlsx';

const Invoices = () => {
  const { isAdmin, users, currentUser } = useAuth(); // Obtenemos users y currentUser
  const { addNotification } = useNotification();
  
  // Nombre dinámico de la pestaña según rol
  const importedCasesTabName = isAdmin ? 'Casos importados' : 'Casos Atendidos';
  
  const [activeTab, setActiveTab] = useState(importedCasesTabName);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Efecto para actualizar la pestaña activa si cambia el rol dinámicamente
  useEffect(() => {
    if (!isAdmin && activeTab === 'Casos importados') {
        setActiveTab('Casos Atendidos');
    } else if (isAdmin && activeTab === 'Casos Atendidos') {
        setActiveTab('Casos importados');
    }
  }, [isAdmin, activeTab]);

  // Filtros de Fecha
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Estados para el modal de objeción (Crear)
  const [isObjectionModalOpen, setIsObjectionModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [objectionAmount, setObjectionAmount] = useState('');
  const [objectionSurcharge, setObjectionSurcharge] = useState(''); // Nuevo estado para Recargo
  const [objectionReason, setObjectionReason] = useState('');

  // Estados para el modal de detalle (Ver)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailInvoice, setSelectedDetailInvoice] = useState<any | null>(null);

  // Estados para Carga de Archivos (Admin)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadInsurer, setUploadInsurer] = useState('ASSA'); // Default insurer
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para Creación Manual (Admin)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [manualInvoice, setManualInvoice] = useState({
      date: new Date().toISOString().split('T')[0],
      id: '',
      technicianId: '', // ID del usuario seleccionado
      technicianName: '', // Nombre texto libre si no selecciona ID
      insurer: 'ASSA',
      service: '',
      amount: '',
      surcharge: ''
  });

  // Estados para Edición en Línea (Monto, Recargo y TÉCNICO)
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Inicializar facturas desde LocalStorage para persistencia
  const [invoices, setInvoices] = useState<any[]>(() => {
    try {
      const savedInvoices = localStorage.getItem('crm_invoices');
      return savedInvoices ? JSON.parse(savedInvoices) : [];
    } catch (error) {
      console.error("Error loading invoices from storage", error);
      return [];
    }
  });

  // Guardar en LocalStorage cada vez que cambian las facturas
  useEffect(() => {
    localStorage.setItem('crm_invoices', JSON.stringify(invoices));
  }, [invoices]);

  const tabs = [
    { 
        name: importedCasesTabName, 
        // Admin ve 'importado', Colaborador ve 'atendido'
        filter: isAdmin ? 'importado' : 'atendido' 
    },
    { name: 'Casos reclamados', filter: 'reclamado' }, 
    { name: 'Casos a facturar', filter: 'pendiente' }
  ];

  // --- Lógica de Negocio ---

  const handleApprove = (id: string) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return;

    if (invoice.status === 'importado') {
        // Flujo Importación: Importado -> Atendido (Publicar para el técnico)
        setInvoices(prev => prev.map(inv => 
            inv.id === id ? { ...inv, status: 'atendido' } : inv
        ));
        addNotification("Caso Publicado", `El caso #${id} ahora es visible para el técnico.`, "success");
    } else if (invoice.status === 'atendido') {
        // Flujo normal: Atendido -> Pendiente (Mover a Facturación)
        setInvoices(prev => prev.map(inv => 
            inv.id === id ? { ...inv, status: 'pendiente' } : inv
        ));
    } else if (invoice.status === 'reclamado') {
        // Flujo Reclamo Aprobado
        setInvoices(prev => {
            const updatedList = prev.map(inv => 
                inv.id === id ? { ...inv, status: 'aprobado' } : inv
            );
            
            const billableCopy = {
                ...invoice,
                id: `${invoice.id}-FACT`, 
                status: 'pendiente',
                networkObservation: `Reclamo Aprobado. Copia de ${invoice.id}`
            };

            return [billableCopy, ...updatedList];
        });
    }
  };

  const handleRejectClick = (id: string) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return;

    if (invoice.status === 'importado') {
        // Flujo Importación: Eliminar borrador
        if(window.confirm("¿Estás seguro de eliminar este caso importado?")) {
            setInvoices(prev => prev.filter(inv => inv.id !== id));
            addNotification("Caso Eliminado", `El caso #${id} ha sido eliminado de la importación.`, "info");
        }
    } else if (invoice.status === 'atendido') {
        setSelectedInvoiceId(id);
        setObjectionAmount(invoice.amount.toString());
        // Inicializar recargo si existe, sino vacío para obligar entrada o 0
        setObjectionSurcharge(invoice.surcharge ? invoice.surcharge.toString() : '0'); 
        setObjectionReason('');
        setIsObjectionModalOpen(true);
    } else if (invoice.status === 'reclamado') {
        setInvoices(prev => {
            const updatedList = prev.map(inv => 
                inv.id === id ? { ...inv, status: 'rechazado' } : inv
            );

            const billableCopy = {
                ...invoice,
                id: `${invoice.id}-FACT`,
                status: 'pendiente',
                amount: invoice.originalAmount || invoice.amount,
                networkObservation: `Reclamo Rechazado. Se factura monto original. Copia de ${invoice.id}`
            };

            return [billableCopy, ...updatedList];
        });
    }
  };

  const handleViewDetail = (invoice: any) => {
    setSelectedDetailInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleConfirmObjection = () => {
    if (selectedInvoiceId) {
        const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        
        addNotification(
            "⚠️ Nuevo Reclamo",
            `El caso #${selectedInvoiceId} ha sido objetado y pasado a reclamaciones. Monto solicitado: $${objectionAmount}`,
            "warning"
        );

        setInvoices(prev => prev.map(inv => 
            inv.id === selectedInvoiceId ? { 
                ...inv, 
                status: 'reclamado',
                originalAmount: inv.amount, 
                amount: Number(objectionAmount), 
                surcharge: Number(objectionSurcharge || 0), // Guardar el recargo objetado
                observation: objectionReason,
                claimDate: today,
                networkObservation: '',
                responseDate: ''
            } : inv
        ));
        
        setIsObjectionModalOpen(false);
        setSelectedInvoiceId(null);
        setObjectionReason('');
        setObjectionAmount('');
        setObjectionSurcharge('');
    }
  };

  // --- Lógica de Creación Manual ---
  const handleCreateManualSubmit = () => {
      // Validaciones básicas
      if (!manualInvoice.id || !manualInvoice.service) {
          alert("Por favor complete el N° de Expediente y el Servicio.");
          return;
      }

      // Resolver Usuario
      let userId: string | null = null;
      let userName: string | null = null;
      let technicianName = manualInvoice.technicianName || 'Desconocido';

      if (manualInvoice.technicianId) {
          const user = users.find(u => u.id === manualInvoice.technicianId);
          if (user) {
              userId = user.id;
              userName = user.name;
              technicianName = user.name;
          }
      }

      // Formatear fecha para display (dd/mm/yyyy)
      const [y, m, d] = manualInvoice.date.split('-');
      const formattedDate = `${d}/${m}/${y}`;

      const newInvoice = {
          id: manualInvoice.id,
          technician: technicianName,
          userId: userId,
          userName: userName,
          insurer: manualInvoice.insurer,
          service: manualInvoice.service,
          date: formattedDate,
          amount: parseFloat(manualInvoice.amount) || 0,
          surcharge: parseFloat(manualInvoice.surcharge) || 0,
          originalAmount: parseFloat(manualInvoice.amount) || 0,
          status: 'importado',
          claimDate: '',
          observation: '',
          networkObservation: '',
          responseDate: ''
      };

      setInvoices(prev => [newInvoice, ...prev]);
      setIsCreateModalOpen(false);
      
      // Reset form
      setManualInvoice({
          date: new Date().toISOString().split('T')[0],
          id: '',
          technicianId: '',
          technicianName: '',
          insurer: 'ASSA',
          service: '',
          amount: '',
          surcharge: ''
      });

      addNotification("Expediente Creado", `Se ha creado el caso #${manualInvoice.id} exitosamente.`, "success");
  };

  // --- Lógica de Edición en Línea ---
  const startEditing = (invoice: any, field: string) => {
      let isAllowed = false;

      if (['aprobado', 'rechazado'].includes(invoice.status) && field !== 'networkObservation') {
          return;
      }

      if (field === 'networkObservation' || field === 'technician') {
          isAllowed = isAdmin;
      } else {
          // Lógica de permisos para campos numéricos (Monto, Recargo)
          // 1. Si estamos en la pestaña principal (Importados/Atendidos), solo Admin edita.
          if (activeTab === importedCasesTabName) {
              isAllowed = isAdmin;
          } else {
              // 2. En otras pestañas ('Casos a facturar', 'Reclamados')
              // Solo el admin puede editar en Casos a Facturar y Reclamados
              isAllowed = (activeTab === 'Casos a facturar' && isAdmin) ||
                          (activeTab === 'Casos reclamados' && isAdmin);
          }
      }

      if (isAllowed) {
          setEditingCell({ id: invoice.id, field });
          if (field === 'technician') {
             setEditValue(invoice.userId || '');
          } else {
             setEditValue(invoice[field] ? invoice[field].toString() : '');
          }
      }
  };

  const saveEdit = () => {
      if (editingCell) {
          // Lógica especial para guardar Técnico
          if (editingCell.field === 'technician') {
               const selectedUser = users.find(u => u.id === editValue);
               setInvoices(prev => prev.map(inv => {
                   if (inv.id === editingCell.id) {
                       return {
                           ...inv,
                           userId: selectedUser ? selectedUser.id : null,
                           userName: selectedUser ? selectedUser.name : null,
                           // Si seleccionó un usuario, usamos su nombre. Si desasignó (vacío), mantenemos el nombre original o ponemos Desconocido?
                           // Asumiremos que si desasigna, mantenemos el texto original por si era un externo.
                           technician: selectedUser ? selectedUser.name : inv.technician 
                       };
                   }
                   return inv;
               }));
               setEditingCell(null);
               setEditValue('');
               return;
          }

          const isNumeric = ['amount', 'surcharge', 'originalAmount'].includes(editingCell.field);
          let finalValue: string | number = editValue;

          if (isNumeric) {
              const parsed = parseFloat(editValue);
              if (isNaN(parsed)) return;
              finalValue = parsed;
          }

          setInvoices(prev => prev.map(inv => {
              if (inv.id === editingCell.id) {
                  const updatedInv = { ...inv, [editingCell.field]: finalValue };
                  if (editingCell.field === 'amount') {
                      updatedInv.originalAmount = finalValue as number;
                  }
                  return updatedInv;
              }
              return inv;
          }));
          
          setEditingCell(null);
          setEditValue('');
      }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          saveEdit();
      } else if (e.key === 'Escape') {
          setEditingCell(null);
          setEditValue('');
      }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // --- Lógica de Carga de Archivos (AI) ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
  };

  // Función auxiliar para buscar usuario en el sistema (Fallback local)
  const findMatchingUser = (technicianName: string) => {
      if (!technicianName) return null;
      const normalizedTech = technicianName.toLowerCase().trim();
      
      return users.find(u => {
          const normalizedUser = u.name.toLowerCase().trim();
          return normalizedUser.includes(normalizedTech) || normalizedTech.includes(normalizedUser);
      });
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
        const base64Data = await convertFileToBase64(selectedFile);
        const mimeType = selectedFile.type || 'application/pdf';

        // 1. Obtener datos extraídos de la IA (Pasamos los usuarios para que la IA haga el match)
        const extractedData = await processInvoiceFile(base64Data, mimeType, uploadInsurer, users);

        if (extractedData && Array.isArray(extractedData)) {
            // 2. Procesar y Asignar Usuario
            const newInvoices = extractedData.map(item => {
                let technicianName = item.technician || 'Desconocido';
                let userId = item.userId || null;

                // Fallback: Si la IA no devolvió ID pero sí nombre, intentamos buscarlo localmente (Red de seguridad)
                if (!userId && technicianName !== 'Desconocido') {
                    const matchedUser = findMatchingUser(technicianName);
                    if (matchedUser) {
                        userId = matchedUser.id;
                        technicianName = matchedUser.name; 
                    }
                }
                
                // Si tenemos userId, aseguramos que el nombre coincida exactamente con el del sistema
                let userName = null;
                if (userId) {
                    const user = users.find(u => u.id === userId);
                    if (user) {
                        technicianName = user.name;
                        userName = user.name;
                    }
                }

                return {
                    id: item.id || 'S/N',
                    technician: technicianName,
                    userId: userId,
                    userName: userName,
                    insurer: item.insurer || uploadInsurer,
                    service: item.service || 'Servicio General',
                    date: item.date || new Date().toLocaleDateString(),
                    amount: 0, // Iniciar en 0.00
                    surcharge: 0, // Iniciar en 0.00
                    originalAmount: 0, // Iniciar en 0.00
                    status: 'importado', // ESTADO INICIAL PARA ADMIN
                    claimDate: '',
                    observation: '',
                    networkObservation: '',
                    responseDate: ''
                };
            });

            const assignedCount = newInvoices.filter(i => i.userId).length;
            
            setInvoices(prev => [...newInvoices, ...prev]);
            setIsUploadModalOpen(false);
            setSelectedFile(null);
            
            addNotification(
                "Procesamiento Completado", 
                `${newInvoices.length} expedientes cargados a 'Casos importados'.`, 
                "success"
            );
        }
    } catch (error) {
        console.error("Error al procesar archivo", error);
        alert("Hubo un error al procesar el archivo. Asegúrate de que el formato sea válido.");
    } finally {
        setIsProcessing(false);
    }
  };

  // --- Helper de Fecha ---
  const parseDateToTimestamp = (dateStr: string) => {
      if (!dateStr) return 0;
      const cleanStr = dateStr.replace(/\//g, '-');
      const parts = cleanStr.split('-');
      
      if (parts.length === 3) {
          if (parts[2].length === 4) {
             const d = parseInt(parts[0]);
             const m = parseInt(parts[1]) - 1;
             const y = parseInt(parts[2]);
             return new Date(y, m, d).getTime();
          }
          if (parts[0].length === 4) {
             const y = parseInt(parts[0]);
             const m = parseInt(parts[1]) - 1;
             const d = parseInt(parts[2]);
             return new Date(y, m, d).getTime();
          }
      }
      return new Date(dateStr).getTime();
  };


  // --- Renderizado ---

  const filteredInvoices = invoices.filter(inv => {
    // 0. Filtro de Seguridad por Rol
    if (!isAdmin && inv.userId !== currentUser.id) {
        return false;
    }

    // 1. Filtro de Texto
    const matchesSearch = 
        inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inv.technician.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inv.insurer.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inv.service.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Filtro de Fechas
    let matchesDate = true;
    const invDateTs = parseDateToTimestamp(inv.date || inv.claimDate);

    if (startDate) {
        const [sy, sm, sd] = startDate.split('-').map(Number);
        const startTs = new Date(sy, sm - 1, sd).getTime();
        if (invDateTs < startTs) matchesDate = false;
    }
    if (endDate) {
        const [ey, em, ed] = endDate.split('-').map(Number);
        const endTs = new Date(ey, em - 1, ed, 23, 59, 59).getTime();
        if (invDateTs > endTs) matchesDate = false;
    }

    // 3. Filtro de Pestaña
    if (activeTab === 'Casos reclamados') {
        const isReclaimStatus = ['reclamado', 'aprobado', 'rechazado'].includes(inv.status);
        return isReclaimStatus && matchesSearch && matchesDate;
    }
    
    const matchesTab = tabs.find(t => t.name === activeTab)?.filter === inv.status;
    return matchesTab && matchesSearch && matchesDate;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const totalSurcharge = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.surcharge) || 0), 0);
  
  const isReclaimedTab = activeTab === 'Casos reclamados';
  // Helper para saber si las celdas estándar son editables (Monto, Recargo)
  // Ahora restringido a solo administradores en 'Casos a facturar'
  const isStandardEditable = (activeTab === 'Casos a facturar' && isAdmin) || (activeTab === importedCasesTabName && isAdmin);


  // --- Lógica de Exportación ---
  const handleExport = () => {
    if (filteredInvoices.length === 0) return;

    // Formatear datos para exportación
    const dataToExport = filteredInvoices.map(inv => ({
      Fecha: inv.date || inv.claimDate,
      Expediente: inv.id,
      Técnico: inv.technician,
      'Usuario Asignado': inv.userName || 'No asignado', // Nuevo campo en excel
      Aseguradora: inv.insurer,
      Servicio: inv.service,
      Monto: inv.amount,
      Recargo: inv.surcharge || 0,
      Estatus: inv.status,
      Observaciones: inv.observation,
      'Observaciones Admin': inv.networkObservation
    }));

    const ws = utils.json_to_sheet(dataToExport);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Facturación");
    
    // Generar nombre de archivo
    const fileName = `Reporte_${activeTab.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Facturación</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
             {/* Botón Exportar (Solo para Casos a facturar con datos) */}
             {activeTab === 'Casos a facturar' && filteredInvoices.length > 0 && (
                 <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex-1 sm:flex-none justify-center"
                 >
                    <Download size={18} />
                    <span>Exportar</span>
                 </button>
             )}

            {isAdmin && (
                <>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex-1 sm:flex-none justify-center"
                    >
                        <Plus size={18} />
                        <span>Nuevo</span>
                    </button>
                    <button 
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex-1 sm:flex-none justify-center"
                    >
                        <Upload size={18} />
                        <span>Importar</span>
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Barra de Pestañas con scroll horizontal */}
      <div className="w-full overflow-x-auto pb-1 -mb-1 hide-scrollbar">
        <div className="flex items-end gap-1 border-b border-slate-200 pt-2 min-w-max">
            {tabs.map((tab) => (
                <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className={`
                        px-6 py-3 font-bold text-sm rounded-t-lg transition-colors duration-200 whitespace-nowrap
                        ${activeTab === tab.name 
                            ? 'bg-white text-sky-700 border-t border-x border-slate-200 shadow-[0_1px_0_white] relative translate-y-[1px] z-10' 
                            : 'bg-[#0070BA] text-white hover:bg-[#005ea6]'
                        }
                    `}
                >
                    {tab.name}
                </button>
            ))}
        </div>
      </div>

       {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Filtro de Fechas */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm overflow-x-auto max-w-full">
             <Calendar size={18} className="text-slate-400 ml-2" />
             <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Desde:</span>
                <input 
                    type="date" 
                    className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 p-1"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
             </div>
             <div className="w-px h-4 bg-slate-200 mx-1"></div>
             <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Hasta:</span>
                <input 
                    type="date" 
                    className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 p-1"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
             </div>
             {(startDate || endDate) && (
                 <button 
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
                    title="Limpiar fechas"
                 >
                     <X size={14} />
                 </button>
             )}
        </div>

        {/* Barra de búsqueda */}
        <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Buscar por expediente, técnico, aseguradora o servicio..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-slate-200 overflow-hidden mt-0">
        {/* Wrapper para scroll horizontal en la tabla */}
        <div className="overflow-x-auto">
            {isReclaimedTab ? (
                // TABLA ESPECÍFICA PARA CASOS RECLAMADOS
                <table className="w-full text-left min-w-[1100px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-4 font-bold text-slate-700 text-sm">Fecha</th>
                            <th className="px-4 py-4 font-bold text-slate-700 text-sm">N° Expediente</th>
                            <th className="px-4 py-4 font-bold text-slate-700 text-sm">Técnico</th>
                            <th className="px-4 py-4 font-bold text-slate-700 text-sm">Aseguradora</th>
                            <th className="px-4 py-4 font-bold text-slate-700 text-sm">Servicio</th>
                            <th className="px-4 py-4 font-bold text-slate-700 text-sm">Monto reclamado</th>
                            <th className="px-4 py-4 font-bold text-slate-700 text-sm">Recargo reclamado</th>
                            <th className="px-4 py-4 font-bold text-slate-700 text-sm">Estatus</th>
                            <th className="px-4 py-4 font-bold text-slate-700 text-sm w-64">Observaciones</th>
                            <th className="px-4 py-4 font-bold text-slate-700 text-sm w-64">Observaciones Admin</th>
                             {/* Acciones Header (Solo Admin) */}
                            {isAdmin && <th className="px-4 py-4 font-bold text-slate-700 text-sm text-center">Acciones</th>}
                            <th className="px-4 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-4 text-slate-600 text-sm">{inv.claimDate || inv.date}</td>
                                <td className="px-4 py-4 text-slate-600 text-sm font-medium">{inv.id}</td>
                                {/* Celda Técnico Editable */}
                                <td 
                                    className={`px-4 py-4 text-slate-600 text-sm group/tech relative ${isAdmin ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                                    onClick={() => isAdmin && startEditing(inv, 'technician')}
                                    title={isAdmin ? "Haz clic para asignar a un usuario" : undefined}
                                >
                                    {editingCell?.id === inv.id && editingCell?.field === 'technician' ? (
                                        <select
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={saveEdit}
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full p-1 border border-indigo-500 rounded text-sm focus:outline-none"
                                        >
                                            <option value="">-- Sin asignar --</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="flex flex-col">
                                            <span>{inv.technician}</span>
                                            {isAdmin && (
                                                <div className="flex items-center gap-1">
                                                    {inv.userName ? (
                                                        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1 rounded w-fit flex items-center gap-0.5">
                                                            <UserIcon size={8} /> {inv.userName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded w-fit">Sin asignar</span>
                                                    )}
                                                    <Pencil size={12} className="text-slate-400 opacity-0 group-hover/tech:opacity-100 transition-opacity" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </td>

                                <td className="px-4 py-4 text-slate-600 text-sm uppercase">{inv.insurer}</td>
                                <td className="px-4 py-4 text-slate-600 text-sm">{inv.service}</td>
                                
                                {/* Celda de Monto Reclamado (Editable solo si es Admin y no está cerrado) */}
                                <td 
                                    className={`px-4 py-4 font-medium text-sm group/amount relative ${(isAdmin && inv.status === 'reclamado') ? 'cursor-pointer' : ''}`}
                                    onClick={() => (isAdmin && inv.status === 'reclamado') && startEditing(inv, 'amount')}
                                    title={(isAdmin && inv.status === 'reclamado') ? "Haz clic para editar el monto" : undefined}
                                >
                                    {editingCell?.id === inv.id && editingCell?.field === 'amount' ? (
                                        <div className="flex items-center">
                                            <span className="text-slate-400 mr-1">$</span>
                                            <input 
                                                type="number" 
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={saveEdit}
                                                onKeyDown={handleEditKeyDown}
                                                autoFocus
                                                className="w-24 px-2 py-1 border border-indigo-500 rounded focus:outline-none shadow-sm text-sm"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    ) : (
                                        <div className={`flex items-center gap-2 ${(isAdmin && inv.status === 'reclamado') ? 'text-slate-800' : 'text-slate-600'}`}>
                                            ${formatCurrency(inv.amount)}
                                            {(isAdmin && inv.status === 'reclamado') && <Pencil size={14} className="text-slate-400 opacity-0 group-hover/amount:opacity-100 transition-opacity" />}
                                        </div>
                                    )}
                                </td>

                                {/* Celda de Recargo Reclamado (Editable solo si es Admin y no está cerrado) */}
                                <td 
                                    className={`px-4 py-4 font-medium text-sm group/surcharge relative ${(isAdmin && inv.status === 'reclamado') ? 'cursor-pointer' : ''}`}
                                    onClick={() => (isAdmin && inv.status === 'reclamado') && startEditing(inv, 'surcharge')}
                                    title={(isAdmin && inv.status === 'reclamado') ? "Haz clic para editar el recargo" : undefined}
                                >
                                    {editingCell?.id === inv.id && editingCell?.field === 'surcharge' ? (
                                        <div className="flex items-center">
                                            <span className="text-slate-400 mr-1">$</span>
                                            <input 
                                                type="number" 
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={saveEdit}
                                                onKeyDown={handleEditKeyDown}
                                                autoFocus
                                                className="w-24 px-2 py-1 border border-indigo-500 rounded focus:outline-none shadow-sm text-sm"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    ) : (
                                        <div className={`flex items-center gap-2 ${(isAdmin && inv.status === 'reclamado') ? 'text-slate-800' : 'text-slate-600'}`}>
                                            ${formatCurrency(inv.surcharge || 0)}
                                            {(isAdmin && inv.status === 'reclamado') && <Pencil size={14} className="text-slate-400 opacity-0 group-hover/surcharge:opacity-100 transition-opacity" />}
                                        </div>
                                    )}
                                </td>

                                <td className="px-4 py-4">
                                    {inv.status === 'reclamado' && (
                                        <span className="flex items-center gap-2 text-slate-600 text-sm">
                                            <span className="w-3 h-3 rounded-full bg-[#0070BA]"></span>
                                            En Revisión
                                        </span>
                                    )}
                                    {inv.status === 'aprobado' && (
                                        <span className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                            Aprobado
                                        </span>
                                    )}
                                    {inv.status === 'rechazado' && (
                                        <span className="flex items-center gap-2 text-red-600 text-sm font-medium">
                                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                            Rechazado
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-slate-600 text-sm max-w-xs truncate" title={inv.observation}>
                                    {inv.observation}
                                </td>
                                
                                {/* Celda Observaciones Admin (Editable) */}
                                <td 
                                    className={`px-4 py-4 text-slate-600 text-sm ${isAdmin ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                                    onClick={() => isAdmin && startEditing(inv, 'networkObservation')}
                                    title={isAdmin ? "Haz clic para editar observaciones" : undefined}
                                >
                                    {editingCell?.id === inv.id && editingCell?.field === 'networkObservation' ? (
                                        <textarea 
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={saveEdit}
                                            onKeyDown={handleEditKeyDown}
                                            autoFocus
                                            className="w-full min-w-[200px] p-2 border border-indigo-500 rounded focus:outline-none shadow-sm text-sm"
                                            onClick={(e) => e.stopPropagation()}
                                            rows={2}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between gap-2 group/obs">
                                            <span className="truncate max-w-xs block">{inv.networkObservation || '-'}</span>
                                            {isAdmin && <Pencil size={14} className="text-slate-400 opacity-0 group-hover/obs:opacity-100 transition-opacity flex-shrink-0" />}
                                        </div>
                                    )}
                                </td>
                                
                                {/* Acciones (Solo Admin y solo si está activo/reclamado) */}
                                {isAdmin && (
                                    <td className="px-4 py-4 text-center">
                                        {inv.status === 'reclamado' ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleApprove(inv.id); }}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                                                    title="Aprobar Reclamo"
                                                >
                                                    <Check size={20} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRejectClick(inv.id); }}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Rechazar Reclamo"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400 text-center italic">
                                                Cerrado
                                            </div>
                                        )}
                                    </td>
                                )}

                                <td className="px-4 py-4 text-center">
                                    <button 
                                        onClick={() => handleViewDetail(inv)}
                                        className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 shadow-sm border border-slate-200 transition-colors"
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                // TABLA ESTÁNDAR PARA OTRAS PESTAÑAS
                <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Fecha</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">N° Expediente</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Técnico</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Aseguradora</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Servicio</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Monto</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Recargo</th>
                            {activeTab === importedCasesTabName && (
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-center">Acciones</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-slate-600 text-sm">{inv.date}</td>
                                <td className="px-6 py-4 font-medium text-slate-800 text-sm flex items-center gap-2">
                                    <FileText size={16} className="text-slate-400"/>
                                    {inv.id}
                                </td>
                                
                                {/* Celda Técnico Editable (Standard Table) */}
                                <td 
                                    className={`px-6 py-4 text-slate-600 text-sm group/tech relative ${isAdmin ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                                    onClick={() => isAdmin && startEditing(inv, 'technician')}
                                    title={isAdmin ? "Haz clic para asignar a un usuario" : undefined}
                                >
                                    {editingCell?.id === inv.id && editingCell?.field === 'technician' ? (
                                        <select
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={saveEdit}
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full p-1 border border-indigo-500 rounded text-sm focus:outline-none"
                                        >
                                            <option value="">-- Sin asignar --</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="flex flex-col">
                                            <span>{inv.technician}</span>
                                            {isAdmin && (
                                                <div className="flex items-center gap-1">
                                                    {inv.userName ? (
                                                        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1 rounded w-fit flex items-center gap-0.5">
                                                            <UserIcon size={8} /> {inv.userName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded w-fit">Sin asignar</span>
                                                    )}
                                                    <Pencil size={12} className="text-slate-400 opacity-0 group-hover/tech:opacity-100 transition-opacity" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </td>

                                <td className="px-6 py-4 text-slate-600 text-sm">{inv.insurer}</td>
                                <td className="px-6 py-4 text-slate-600 text-sm">{inv.service}</td>
                                
                                {/* Celda de Monto Editable */}
                                <td 
                                    className={`px-6 py-4 font-medium text-slate-800 text-sm group/amount relative ${isStandardEditable ? 'cursor-pointer' : ''}`}
                                    onClick={() => isStandardEditable && startEditing(inv, 'amount')}
                                    title={isStandardEditable ? "Haz clic para editar el monto" : undefined}
                                >
                                    {editingCell?.id === inv.id && editingCell?.field === 'amount' ? (
                                        <div className="flex items-center">
                                            <span className="text-slate-400 mr-1">$</span>
                                            <input 
                                                type="number" 
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={saveEdit}
                                                onKeyDown={handleEditKeyDown}
                                                autoFocus
                                                className="w-24 px-2 py-1 border border-indigo-500 rounded focus:outline-none shadow-sm text-sm"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            ${formatCurrency(inv.amount)}
                                            {isStandardEditable && <Pencil size={14} className="text-slate-400 opacity-0 group-hover/amount:opacity-100 transition-opacity" />}
                                        </div>
                                    )}
                                </td>

                                {/* Celda de Recargo Editable */}
                                <td 
                                    className={`px-6 py-4 font-medium text-slate-800 text-sm group/surcharge relative ${isStandardEditable ? 'cursor-pointer' : ''}`}
                                    onClick={() => isStandardEditable && startEditing(inv, 'surcharge')}
                                    title={isStandardEditable ? "Haz clic para editar el recargo" : undefined}
                                >
                                    {editingCell?.id === inv.id && editingCell?.field === 'surcharge' ? (
                                        <div className="flex items-center">
                                            <span className="text-slate-400 mr-1">$</span>
                                            <input 
                                                type="number" 
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={saveEdit}
                                                onKeyDown={handleEditKeyDown}
                                                autoFocus
                                                className="w-24 px-2 py-1 border border-indigo-500 rounded focus:outline-none shadow-sm text-sm"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            ${formatCurrency(inv.surcharge || 0)}
                                            {isStandardEditable && <Pencil size={14} className="text-slate-400 opacity-0 group-hover/surcharge:opacity-100 transition-opacity" />}
                                        </div>
                                    )}
                                </td>

                                {/* Acciones (Solo en Casos Atendidos/Importados) */}
                                {activeTab === importedCasesTabName && (
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleApprove(inv.id); }}
                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                                                title={isAdmin ? "Publicar para Técnico" : "Aprobar"}
                                            >
                                                <Check size={20} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRejectClick(inv.id); }}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title={isAdmin ? "Eliminar Importación" : "Rechazar"}
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    {/* Subtotal Footer for 'Casos a facturar' */}
                    {activeTab === 'Casos a facturar' && filteredInvoices.length > 0 && (
                        <tfoot className="bg-indigo-50/50 border-t-2 border-indigo-100">
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-right font-bold text-indigo-900 text-sm">
                                    SUBTOTAL
                                </td>
                                <td className="px-6 py-4 font-bold text-indigo-700 text-lg">
                                    ${formatCurrency(totalAmount)}
                                </td>
                                <td className="px-6 py-4 font-bold text-indigo-700 text-lg">
                                    ${formatCurrency(totalSurcharge)}
                                </td>
                            </tr>
                            <tr className="bg-indigo-100 border-t border-indigo-200">
                                <td colSpan={5} className="px-6 py-4 text-right font-black text-indigo-900 text-sm uppercase tracking-wide">
                                    TOTAL GENERAL
                                </td>
                                <td colSpan={2} className="px-6 py-4 font-black text-indigo-900 text-xl">
                                    ${formatCurrency(totalAmount + totalSurcharge)}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            )}
        </div>
        {filteredInvoices.length === 0 && (
             <div className="p-12 text-center text-slate-500">
                <p className="text-lg font-medium text-slate-600 mb-1">No hay expedientes en esta categoría</p>
                <p className="text-sm">
                    {isAdmin 
                        ? "Prueba cambiando de pestaña o ajustando la búsqueda." 
                        : "No tienes expedientes asignados que coincidan con los filtros."}
                </p>
            </div>
        )}
      </div>

      {/* Modal Carga Manual (Admin) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-[1px]">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 flex justify-between items-center border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800">Nuevo Expediente</h3>
                    <button 
                        onClick={() => setIsCreateModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Fila 1 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Fecha</label>
                            <input 
                                type="date" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={manualInvoice.date}
                                onChange={(e) => setManualInvoice({...manualInvoice, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">N° Expediente</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Ej: 123456"
                                value={manualInvoice.id}
                                onChange={(e) => setManualInvoice({...manualInvoice, id: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    {/* Fila 2 */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Técnico / Usuario</label>
                        <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
                            value={manualInvoice.technicianId}
                            onChange={(e) => {
                                const selected = users.find(u => u.id === e.target.value);
                                setManualInvoice({
                                    ...manualInvoice, 
                                    technicianId: e.target.value,
                                    technicianName: selected ? selected.name : ''
                                })
                            }}
                        >
                            <option value="">-- Seleccionar usuario del sistema --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        {!manualInvoice.technicianId && (
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="O escriba nombre externo..."
                                value={manualInvoice.technicianName}
                                onChange={(e) => setManualInvoice({...manualInvoice, technicianName: e.target.value})}
                            />
                        )}
                    </div>

                     {/* Fila 3 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Aseguradora</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={manualInvoice.insurer}
                                onChange={(e) => setManualInvoice({...manualInvoice, insurer: e.target.value})}
                            >
                                <option value="ASSA">ASSA</option>
                                <option value="Óptima de Seguros">Óptima de Seguros</option>
                                <option value="La Regional de Seguros">La Regional de Seguros</option>
                                <option value="Seguros Fedpa">Seguros Fedpa</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Servicio</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Ej: Cambio de llanta"
                                value={manualInvoice.service}
                                onChange={(e) => setManualInvoice({...manualInvoice, service: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Fila 4 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Monto ($)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={manualInvoice.amount}
                                onChange={(e) => setManualInvoice({...manualInvoice, amount: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Recargo ($)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={manualInvoice.surcharge}
                                onChange={(e) => setManualInvoice({...manualInvoice, surcharge: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleCreateManualSubmit}
                        className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
                    >
                        Guardar
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* Modal Carga de Archivos (Upload) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-[1px]">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 flex justify-between items-center border-b border-slate-100">
                    <h3 className="text-xl font-bold text-[#005ea6]">Cargar Expedientes</h3>
                    <button 
                        onClick={() => !isProcessing && setIsUploadModalOpen(false)}
                        className="text-slate-400 hover:text-[#005ea6] transition-colors"
                        disabled={isProcessing}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Selector de Aseguradora (Obligatorio) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Aseguradora del Lote</label>
                        <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 focus:ring-2 focus:ring-[#005ea6] focus:border-transparent outline-none"
                            value={uploadInsurer}
                            onChange={(e) => setUploadInsurer(e.target.value)}
                            disabled={isProcessing}
                        >
                            <option value="ASSA">ASSA</option>
                            <option value="Óptima de Seguros">Óptima de Seguros</option>
                            <option value="La Regional de Seguros">La Regional de Seguros</option>
                            <option value="Seguros Fedpa">Seguros Fedpa</option>
                        </select>
                    </div>

                    {/* Área de Drop/Selección */}
                    <div 
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${selectedFile ? 'border-[#005ea6] bg-blue-50' : 'border-slate-300 hover:border-[#005ea6] hover:bg-slate-50'}`}
                        onClick={() => !isProcessing && fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf,.csv,.xls,.xlsx,.xlsm,image/*"
                        />
                        
                        {selectedFile ? (
                            <div className="flex flex-col items-center gap-2">
                                <FileSpreadsheet className="text-[#005ea6]" size={40} />
                                <p className="font-medium text-slate-700">{selectedFile.name}</p>
                                <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-500">
                                <Upload size={40} className="mb-2" />
                                <p className="font-medium">Haz clic para subir o arrastra tu archivo</p>
                                <p className="text-xs">Soporta PDF, Excel, CSV e Imágenes</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsUploadModalOpen(false)}
                        className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                        disabled={isProcessing}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleProcessFile}
                        disabled={!selectedFile || isProcessing}
                        className="flex items-center gap-2 px-8 py-2 bg-[#0070BA] text-white font-bold rounded-lg hover:bg-[#005ea6] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Procesando con IA...
                            </>
                        ) : (
                            "Procesar Archivo"
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Modal Crear Objeción (Existente) */}
      {isObjectionModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-[1px]">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-[#005ea6]">Crear objeción</h3>
                    <button 
                        onClick={() => setIsObjectionModalOpen(false)}
                        className="text-slate-400 hover:text-[#005ea6] transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="px-6 pb-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Campo Monto */}
                        <div className="space-y-2">
                            <label className="block text-lg font-bold text-[#005ea6]">Monto</label>
                            <p className="text-sm text-slate-600 font-medium">Digite el monto a solicitar</p>
                            <input 
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-slate-700 outline-none focus:ring-1 focus:ring-[#005ea6] focus:border-[#005ea6]"
                                value={objectionAmount}
                                onChange={(e) => setObjectionAmount(e.target.value)}
                            />
                        </div>

                        {/* Campo Recargo */}
                        <div className="space-y-2">
                            <label className="block text-lg font-bold text-[#005ea6]">Recargo</label>
                            <p className="text-sm text-slate-600 font-medium">Digite el recargo adicional</p>
                            <input 
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-slate-700 outline-none focus:ring-1 focus:ring-[#005ea6] focus:border-[#005ea6]"
                                value={objectionSurcharge}
                                onChange={(e) => setObjectionSurcharge(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Campo Motivo */}
                    <div className="space-y-2">
                        <label className="block text-lg font-bold text-[#005ea6]">Motivo</label>
                        <p className="text-sm text-slate-600 font-medium">Escribe la razón por la que no estas aceptando este precio</p>
                        <textarea 
                            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-md p-3 text-slate-700 outline-none focus:ring-1 focus:ring-[#005ea6] focus:border-[#005ea6] resize-none border-l-4 border-l-red-500"
                            value={objectionReason}
                            onChange={(e) => setObjectionReason(e.target.value)}
                        ></textarea>
                    </div>
                </div>

                <div className="pb-8 flex justify-center">
                    <button 
                        onClick={handleConfirmObjection}
                        disabled={!objectionAmount || !objectionReason}
                        className="bg-[#7fbce8] hover:bg-[#6aa9d6] text-white font-bold py-2 px-8 rounded-full shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        Comentar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Modal Ver Detalle de Reclamo (Existente) */}
      {isDetailModalOpen && selectedDetailInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-[1px]">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-[#005ea6]">Reclamo</h3>
                    <button 
                        onClick={() => setIsDetailModalOpen(false)}
                        className="text-slate-400 hover:text-[#005ea6] transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="px-8 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                        
                        {/* Fila 1 */}
                        <div>
                            <label className="block font-bold text-slate-700 text-sm mb-1">No. Caso:</label>
                            <p className="text-slate-600 text-sm">{selectedDetailInvoice.id}</p>
                        </div>
                        <div>
                            <label className="block font-bold text-slate-700 text-sm mb-1">Cliente:</label>
                            <p className="text-slate-600 text-sm uppercase">{selectedDetailInvoice.insurer}</p>
                        </div>

                        {/* Fila 2 */}
                        <div>
                            <label className="block font-bold text-slate-700 text-sm mb-1">Fecha:</label>
                            <p className="text-slate-600 text-sm">{selectedDetailInvoice.date}</p>
                        </div>
                        <div>
                            <label className="block font-bold text-slate-700 text-sm mb-1">Fecha reclamo:</label>
                            <p className="text-slate-600 text-sm">{selectedDetailInvoice.claimDate || '-'}</p>
                        </div>

                        {/* Fila 3 */}
                        <div>
                            <label className="block font-bold text-slate-700 text-sm mb-1">Cantidad:</label>
                            <p className="text-slate-600 text-sm">
                                {selectedDetailInvoice.originalAmount ? selectedDetailInvoice.originalAmount.toFixed(2) : selectedDetailInvoice.amount.toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <label className="block font-bold text-slate-700 text-sm mb-1">Monto Reclamado:</label>
                            <p className="text-slate-600 text-sm">{selectedDetailInvoice.amount.toFixed(2)}</p>
                        </div>

                         {/* Fila 4 */}
                        <div>
                             <label className="block font-bold text-slate-700 text-sm mb-1">Notas del reclamo:</label>
                             <p className="text-slate-600 text-sm uppercase leading-relaxed">
                                {selectedDetailInvoice.observation}
                             </p>
                        </div>
                         <div>
                            <label className="block font-bold text-slate-700 text-sm mb-1">Estatus:</label>
                            <p className="text-slate-600 text-sm capitalize">
                                {selectedDetailInvoice.status === 'reclamado' ? 'Reclamado' : selectedDetailInvoice.status}
                            </p>
                        </div>

                         {/* Fila 5 */}
                        <div>
                            <label className="block font-bold text-slate-700 text-sm mb-1">Fecha respuesta:</label>
                            <p className="text-slate-600 text-sm">{selectedDetailInvoice.responseDate || ''}</p>
                        </div>
                        <div>
                            <label className="block font-bold text-slate-700 text-sm mb-1">Respuesta:</label>
                            <p className="text-slate-600 text-sm">{selectedDetailInvoice.networkObservation || ''}</p>
                        </div>
                    </div>
                </div>

                <div className="pb-8 flex justify-center">
                    <button 
                        onClick={() => setIsDetailModalOpen(false)}
                        className="bg-[#005ea6] hover:bg-[#004e8a] text-white font-bold py-2 px-12 rounded-full shadow-sm transition-colors"
                    >
                        Ok
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;