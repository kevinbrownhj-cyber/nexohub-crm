import { GoogleGenAI } from "@google/genai";
import { Contact, Deal, DealStage, SystemUser } from "../types";
import { read, utils } from "xlsx";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEmailDraft = async (contact: Contact, context: string): Promise<string> => {
  try {
    const prompt = `
      Actúa como un asistente de ventas profesional.
      Escribe un borrador de correo electrónico breve y profesional para:
      Nombre: ${contact.name}
      Empresa: ${contact.company}
      Rol: ${contact.role}
      
      El contexto del correo es: ${context}
      
      Mantén el tono cordial pero persuasivo. Firma como "El equipo de NexoHub".
      Solo devuelve el cuerpo del correo, sin saludos pre-texto del modelo.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No se pudo generar el correo.";
  } catch (error) {
    console.error("Error generating email:", error);
    return "Ocurrió un error al contactar con Gemini.";
  }
};

export const analyzeDeal = async (deal: Deal, contact: Contact): Promise<string> => {
  try {
    const prompt = `
      Analiza la siguiente oportunidad de venta (Deal) y dame 3 recomendaciones breves para avanzar a la siguiente etapa.
      
      Detalles del Negocio:
      Título: ${deal.title}
      Valor: $${deal.value}
      Etapa Actual: ${deal.stage}
      Probabilidad Actual: ${deal.probability}%
      Cliente: ${contact.name} (${contact.role} en ${contact.company})
      Notas del Cliente: ${contact.notes}

      Formato de respuesta:
      1. [Recomendación 1]
      2. [Recomendación 2]
      3. [Recomendación 3]
      
      Sé directo y estratégico.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No se pudo analizar el negocio.";
  } catch (error) {
    console.error("Error analyzing deal:", error);
    return "Ocurrió un error al analizar el negocio.";
  }
};

export const suggestNextAction = async (contacts: Contact[]): Promise<string> => {
    try {
        const contactList = contacts.map(c => `- ${c.name} (${c.company}): Último contacto ${c.lastContacted}`).join('\n');
        const prompt = `
            Basado en la siguiente lista de contactos y sus fechas de último contacto, sugiere a qué 3 personas debería contactar hoy y por qué.
            Hoy es ${new Date().toLocaleDateString()}.

            Lista:
            ${contactList}

            Responde en formato JSON array con objetos { name, reason }.
        `;

         const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        return response.text || "[]";
    } catch (error) {
        console.error("Error suggesting actions:", error);
        return "[]";
    }
}

// Nueva función para procesar archivos de facturas/expedientes
export const processInvoiceFile = async (fileBase64: string, mimeType: string, selectedInsurer: string, users: SystemUser[] = []): Promise<any[]> => {
    try {
        // Detectar si es un archivo Excel o CSV
        const isExcel = mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv');
        
        const usersList = users.map(u => `- Nombre: "${u.name}", ID: "${u.id}"`).join('\n');

        const baseInstructions = `
            Eres un experto en extracción de datos de documentos de asistencia vial y facturación.
            Analiza el documento proporcionado y extrae la información de cada expediente encontrado.
            
            Usa las siguientes reglas de razonamiento:

            1. **Fecha**: Busca la fecha del servicio o del expediente. Formato DD-MM-YYYY.
            2. **Número de Expediente**: Busca códigos alfanuméricos, números largos o con guiones (ej. 964165, EXP-2023-001).
            3. **Técnico**: Identifica a la persona que realizó el trabajo. Busca etiquetas como "Nombre Conductor", "Vehículo Servicio", "Gruista" o "Técnico". Si solo hay un nombre de persona asociado al servicio, úsalo.
            4. **Aseguradora**: Busca nombres de aseguradoras (ASSA, Óptima, La Regional, Fedpa, Mapfre, etc.). SI NO ENCUENTRAS NINGUNA EN EL DOCUMENTO, usa obligatoriamente: "${selectedInsurer}".
            5. **Servicio (Razonamiento Crítico)**: Clasifica el servicio ÚNICAMENTE en una de estas categorías basándote en la descripción:
               - "Inspección" (si menciona colisión, choque, avalúo).
               - "Cambio de llanta" (si menciona neumático, pinchazo, goma).
               - "Abasto de combustible" (si menciona gasolina, diesel, combustible).
               - "Paso de corriente" (si menciona batería, jump start, cables).
               - "Cerrajería vehicular" (si menciona llaves, apertura, puerta cerrada).
               - Si no encaja en ninguna, usa "Servicio General".
            6. **Monto**: Busca el total a pagar, monto neto o "monto assa". Extrae solo el número.
            7. **Match de Usuario**:
               Lista de usuarios del sistema:
               ${usersList}
               
               Si el nombre del técnico encontrado coincide (o es muy similar) con alguno de la lista anterior, incluye el campo "userId" con el ID correspondiente. Si no hay coincidencia clara, omite este campo.

            Devuelve un ARRAY JSON con los objetos encontrados. Ejemplo de estructura:
            [
                {
                    "date": "28-10-2023",
                    "id": "964165",
                    "technician": "Juan Perez",
                    "userId": "123",
                    "insurer": "ASSA",
                    "service": "Cerrajería Vehicular",
                    "amount": 150.00
                }
            ]
        `;

        let promptContent;

        if (isExcel) {
            // Parsear Excel a CSV/Texto usando SheetJS
            // 'read' detecta automáticamente el formato (xlsx, xls, csv) desde el base64
            const workbook = read(fileBase64, { type: 'base64' });
            
            // Usamos la primera hoja del libro
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convertir a CSV para que Gemini lo entienda fácilmente
            const csvText = utils.sheet_to_csv(worksheet);
            
            // Enviamos los datos como texto en el prompt
            promptContent = {
                parts: [
                    { text: baseInstructions },
                    { text: `\n\nDATOS DEL ARCHIVO (Formato CSV):\n${csvText}` }
                ]
            };
        } else {
            // Para PDFs e Imágenes, usamos inlineData que soporta la API nativamente
            promptContent = {
                parts: [
                    { text: baseInstructions },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: fileBase64
                        }
                    }
                ]
            };
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: promptContent,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);

    } catch (error) {
        console.error("Error processing invoice file:", error);
        throw error;
    }
};