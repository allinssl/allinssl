export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const paginate = <T>(list: T[], page: number, pageSize: number) => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return { slice: list.slice(start, end), total: list.length };
};

export const nowSec = () => Math.floor(Date.now() / 1000);

export const fen = (yuan: number) => Math.round(yuan * 100);

export const yuan = (fenVal: number) => Number((fenVal / 100).toFixed(2)); 