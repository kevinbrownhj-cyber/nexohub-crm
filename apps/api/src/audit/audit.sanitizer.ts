/**
 * Sanitizer para logs de auditoría
 * Elimina información sensible y limita tamaños
 */

const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'secret',
  'apiKey',
  'api_key',
];

const MAX_STRING_LENGTH = 10000; // 10KB por campo
const MAX_OBJECT_SIZE = 20000; // 20KB total por objeto

export function sanitize(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Si es string, limitar tamaño
  if (typeof obj === 'string') {
    if (obj.length > MAX_STRING_LENGTH) {
      return obj.substring(0, MAX_STRING_LENGTH) + '... [truncated]';
    }
    return obj;
  }

  // Si es array, sanitizar cada elemento
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item));
  }

  // Si no es objeto, devolver tal cual
  if (typeof obj !== 'object') {
    return obj;
  }

  // Sanitizar objeto
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Eliminar claves sensibles
    if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Eliminar archivos base64 grandes
    if (typeof value === 'string' && value.startsWith('data:')) {
      sanitized[key] = '[BASE64_FILE_REMOVED]';
      continue;
    }

    // Recursivamente sanitizar objetos anidados
    sanitized[key] = sanitize(value);
  }

  // Verificar tamaño total
  const jsonStr = JSON.stringify(sanitized);
  if (jsonStr.length > MAX_OBJECT_SIZE) {
    return { 
      _truncated: true, 
      _originalSize: jsonStr.length,
      _message: 'Object too large, truncated'
    };
  }

  return sanitized;
}

export function sanitizeMetadata(metadata: any): any {
  const sanitized = sanitize(metadata);
  
  // Limitar campos específicos de metadata
  if (sanitized.headers) {
    const { authorization, cookie, ...safeHeaders } = sanitized.headers;
    sanitized.headers = safeHeaders;
  }

  return sanitized;
}
