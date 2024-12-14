export const useConvertFlatResolverToFull = async (records: { key: string; value: string }[]) => {
  const dataObj: any = { partners: [] }
  records.forEach((record) => {
    const label = record.key
      .split('__')
      .map((x) => x[0]?.toUpperCase() + x?.slice(1))
      .join(' ')
    const value: any = { setValue: record.value, oldValue: record.value, type: 'string', label }
    if (record.key.includes('partner__[')) {
      const index = parseInt(record.key.split('partner__[').join('').split(']')[0]) // Extract the index as an integer
      const partnerKey = record.key.split(index + ']__')[1]
      const label = partnerKey
        .split('__')
        .map((x) => x[0]?.toUpperCase() + x?.slice(1))
        .join(' ')
      value.label = label
      while (dataObj.partners.length < index + 1) {
        dataObj.partners.push({})
      }

      // FIX THIS, EVEN WHEN 'TRUE' NOTHING SAVES TO ROLES ARRAY
      if (record.key.includes('__is__')) {
        if (!dataObj.partners[index]?.roles) {
          dataObj.partners[index].roles = []
        }
        if (value.setRecord === 'true') {
          dataObj.partners[index].roles.push(record.key.split('__is__')[1])
        }
      } else {
        dataObj.partners[index][partnerKey] = value
      }
    } else {
      dataObj[record.key] = value
    }
  })
  return dataObj
}
