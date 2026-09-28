// Niveles propios de ShipNow. El orden conceptual es debug < http < info < warn < error < fatal.
// Los valores numericos estan invertidos respecto a esa tabla a proposito: Winston da mas
// prioridad al numero mas bajo, asi que fatal: 0 permite que el transport de error.log con
// level 'error' capture tambien fatal, y que warn/info/http no entren en error.log.
export const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  http: 4,
  debug: 5
};

export const logColors = {
  fatal: 'red',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};
