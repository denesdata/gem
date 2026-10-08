/** Romanian counties to NUTS 2. Codes match `rostats` `country` and `romania-regio.json` ids. */
export const NUTS2 = [
  { id: 'RO11', name: 'Nord-Vest', counties: ['BH', 'BN', 'CJ', 'MM', 'SM', 'SJ'] },
  { id: 'RO12', name: 'Centru', counties: ['AB', 'BV', 'CV', 'HR', 'MS', 'SB'] },
  { id: 'RO21', name: 'Nord-Est', counties: ['BC', 'BT', 'IS', 'NT', 'SV', 'VS'] },
  { id: 'RO22', name: 'Sud-Est', counties: ['BR', 'BZ', 'CT', 'GL', 'TL', 'VN'] },
  { id: 'RO31', name: 'Sud-Muntenia', counties: ['AG', 'CL', 'DB', 'GR', 'IL', 'PH', 'TR'] },
  { id: 'RO32', name: 'București-Ilfov', counties: ['B', 'IF'] },
  { id: 'RO41', name: 'Sud-Vest Oltenia', counties: ['DJ', 'GJ', 'MH', 'OT', 'VL'] },
  { id: 'RO42', name: 'Vest', counties: ['AR', 'CS', 'HD', 'TM'] },
] as const

const COUNTY_TO_NUTS = new Map<string, (typeof NUTS2)[number]>(
  NUTS2.flatMap((region) => region.counties.map((code) => [code, region] as const))
)

export function nutsForCounty(code: string) {
  return COUNTY_TO_NUTS.get(code) ?? null
}
