export const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalISOString = (d: Date = new Date()) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, -1);
};

export const parseTaskInput = (input: string) => {
  const tags: string[] = [];
  const tagRegex = /\+([\w-]+)/g;
  const matches = input.match(tagRegex);
  
  if (matches) {
    matches.forEach(match => {
      tags.push(match.substring(1));
    });
  }
  
  const title = input.replace(tagRegex, '').trim();
  return { title, tags };
};

export const sanitizeData = (data: any): any => {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  const sanitized: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      sanitized[key] = sanitizeData(data[key]);
    }
  });
  return sanitized;
};
