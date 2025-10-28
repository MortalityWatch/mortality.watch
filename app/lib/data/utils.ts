/**
 * Get human-readable source description for data sources
 */
const sourceDescriptions: Record<string, string> = {
  un: '<a href="https://population.un.org/wpp/Download/Standard/MostUsed/" target="_blank">United Nations</a>',
  world_mortality: '<a href="https://github.com/akarlinsky/world_mortality" target="_blank">World Mortality</a>',
  mortality_org: '<a href="https://mortality.org/Data/STMF" target="_blank">Human Mortality Database (STMF)</a>',
  eurostat: '<a href="https://ec.europa.eu/eurostat/data/database?node_code=demomwk" target="_blank">Eurostat</a>',
  cdc: '<a href="https://wonder.cdc.gov/mcd.html" target="_blank">CDC</a>',
  statcan: 'Statistics Canada: <a href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1310070901" target="_blank">1</a> <a href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1310076801" target="_blank">2</a>',
  destatis: 'Statistisches Bundesamt: <a href="https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Sterbefaelle-Lebenserwartung/Publikationen/Downloads-Sterbefaelle/statistischer-bericht-sterbefaelle-tage-wochen-monate-aktuell-5126109.html" target="_blank">1</a> <a href="https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Sterbefaelle-Lebenserwartung/Publikationen/Downloads-Sterbefaelle/statistischer-bericht-sterbefaelle-tage-wochen-monate-endg-5126108.html?nn=209016" target="_blank">2</a>'
}

export const getSourceDescription = (source: string) =>
  sourceDescriptions[source] ?? 'unknown'
