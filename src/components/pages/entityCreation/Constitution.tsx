import {
  Document,
  Page,
  PDFDownloadLink,
  PDFViewer,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import React, { useMemo, useState } from 'react'

import { Button } from '@ensdomains/thorin'

import { LegacyDropdown } from '@app/components/@molecules/LegacyDropdown/LegacyDropdown'
import WatermarkedWrapper from '@app/components/WatermarkedWrapper'

// Create styles
const styles: any = {
  constitutionHeader: {
    marginTop: 30,
    marginBottom: 35,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: '25px',
    fontWeight: 800,
    marginBottom: '10px',
  },
  headerSubtitle: {
    fontSize: '18px',
    fontWeight: 800,
  },
  section: {
    marginBottom: '15px',
    marginLeft: '15px',
  },
  sectionHeader: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  listItem: {
    marginLeft: '20px',
    fontSize: '16px',
  },
  subListItem: {
    marginLeft: '50px',
    fontSize: '14px',
    color: '#555',
  },
}
const stylesPDF: any = StyleSheet.create({
  page: {
    padding: '20px',
    paddingBottom: '70px',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    // backgroundRepeat: 'repeat',
    // backgroundImage: `url(https://w7.pngwing.com/pngs/653/502/png-transparent-gray-draft-text-on-black-background-postage-stamps-draft-miscellaneous-angle-white-thumbnail.png)`,
    // backgroundSize: '100px 120px', // Adjust the size as needed
    opacity: 0.9, // Adjust transparency to make it subtle
    // pointerEvents: 'none', // Ensures the watermark doesn't interfere with interactions
    zIndex: 1,
  },
  header: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  listItem: {
    marginLeft: 10,
    fontSize: 12,
  },
  subListItem: {
    marginLeft: 20,
    fontSize: 12,
  },
})

const buildConstitutionView = (profileData: any, userData: any, modelId: any, metadata: any) => {
  const constitutionHeader = (
    <div key="constheader" style={styles.constitutionHeader}>
      <div style={styles.headerTitle}>
        {profileData.name}, {profileData.type}
      </div>
      <div style={styles.headerSubtitle}>{constitutionModel[modelId].title}</div>
    </div>
  )

  const constitutionContent = constitutionModel[modelId].sections.map(
    (section: any, idx: number) => {
      const contentArray = section.content(profileData, userData)
      let subSectionCount = 0

      if (contentArray.length === 1 && !contentArray[0]) {
        return null
      }

      return (
        <div key={section.header} style={styles.section}>
          <div style={styles.sectionHeader}>
            {idx + 1}. {section.header}
          </div>

          {contentArray.map((item: any, index: number) => {
            if (typeof item === 'string' && item.length >= 1) {
              subSectionCount += 1
              return (
                <div key={index} style={styles.listItem}>
                  {idx + 1}.{subSectionCount} {item}
                </div>
              )
            } else if (Array.isArray(item) && item.length >= 1) {
              return item.map((subItem, subIndex) => (
                <div key={`${index}-${subIndex}`} style={styles.subListItem}>
                  {subItem}
                </div>
              ))
            }
            return null
          })}
        </div>
      )
    },
  )

  const constitutionFooter = []
  if (metadata.domain) {
    constitutionFooter.push(
      <div style={{ textAlign: 'right', marginTop: '30px', fontSize: '12px', marginLeft: '12px' }}>
        {metadata.domain}
      </div>,
    )
  }
  if (metadata.LEI) {
    constitutionFooter.push(
      <div style={{ textAlign: 'right', fontSize: '12px', marginLeft: '12px' }}>
        {metadata.LEI}
      </div>,
    )
  }
  if (metadata.multisigAddress) {
    constitutionFooter.push(
      <div style={{ textAlign: 'right', fontSize: '12px', marginLeft: '12px' }}>
        {metadata.multisigAddress}
      </div>,
    )
  }

  let sectionBackground = null
  if (metadata.status === 'APPROVED') {
    sectionBackground = (
      <>
        {constitutionHeader}
        {constitutionContent}
        {constitutionFooter}
      </>
    )
  } else {
    sectionBackground = (
      <WatermarkedWrapper
        watermark={
          'https://w7.pngwing.com/pngs/653/502/png-transparent-gray-draft-text-on-black-background-postage-stamps-draft-miscellaneous-angle-white-thumbnail.png'
        }
      >
        {constitutionHeader}
        {constitutionContent}
        {constitutionFooter}
      </WatermarkedWrapper>
    )
  }
  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '2px black solid',
        maxHeight: '700px',
        overflowY: 'scroll',
      }}
    >
      {sectionBackground}
    </div>
  )
}

// Function to build the constitution sections
const buildConstitution = (profileData: any, userData: any, modelId: any, metadata: any) => {
  console.log('prfofo', profileData)
  const constitutionHeader = (
    <View key={'constheader'} style={{ marginTop: 30, marginBottom: 35, textAlign: 'center' }}>
      <Text style={{ fontSize: 25, fontWeight: 'extrabold' }}>
        {profileData.name}, {profileData.type}
      </Text>
      <Text style={{ fontSize: 18, fontWeight: 'extrabold' }}>
        {constitutionModel[modelId]?.title}
      </Text>
    </View>
  )
  const constitutionContent = constitutionModel[modelId].sections.map((section: any, idx: any) => {
    const contentArray = section.content(profileData, userData)
    let subSectionCount = 0

    return (
      <View key={section.header} style={{ marginBottom: 15, marginLeft: 15 }}>
        {/* Render the section header */}
        <Text style={stylesPDF.header}>
          {idx + 1}. {section.header}
        </Text>

        {contentArray.map((item: any, index: any) => {
          if (typeof item === 'string') {
            // If it's a string, render it as a list item
            subSectionCount += 1
            return (
              <Text key={index} style={{ ...stylesPDF.text, marginLeft: 20 }}>
                {idx + 1}.{subSectionCount} {item}
              </Text>
            )
          } else if (Array.isArray(item)) {
            // If it's an array, render each sub-list item
            return item.map((subItem, subIndex) => (
              <Text
                key={`${index}-${subIndex}`}
                style={{ ...stylesPDF.subListItem, marginLeft: 50 }}
              >
                {subItem}
              </Text>
            ))
          }
          return null
        })}
      </View>
    )
  })

  const constitutionFooter = []
  if (metadata.domain) {
    constitutionFooter.push(
      <Text
        style={{ textAlign: 'right', marginTop: '30px', fontSize: '10px', marginLeft: '12px' }}
        fixed
      >
        {metadata.domain}
      </Text>,
    )
  }
  if (metadata.LEI) {
    constitutionFooter.push(
      <Text style={{ textAlign: 'right', fontSize: '10px', marginLeft: '12px' }} fixed>
        {metadata.LEI}
      </Text>,
    )
  }
  if (metadata.multisigAddress) {
    constitutionFooter.push(
      <Text style={{ textAlign: 'right', fontSize: '10px', marginLeft: '12px' }} fixed>
        {metadata.multisigAddress}
      </Text>,
    )
  }

  return [
    constitutionHeader,
    ...constitutionContent,
    <View style={{ position: 'absolute', bottom: '24px', right: '40px', width: '100%' }} fixed>
      {...constitutionFooter}
    </View>,
  ]
}

const constitutionModel: any = {
  'Model 1': {
    title: 'Certificate of Formation',
    sections: [
      {
        header: 'Name',
        content: (profileData: any, userData: any) => [
          `The name of the ${profileData?.company__type || 'N/A'} is ${
            profileData?.company__name || 'N/A'
          }.`,
        ],
      },
      {
        header: 'Duration',
        content: (profileData: any, userData: any) => [
          `The ${profileData?.company__type || 'N/A'}’s activities begin on ${
            profileData?.company__formation__date?.split('/')?.reverse()?.join('-') || 'N/A'
          }, and its duration shall be perpetual.`,
        ],
      },
      {
        header: 'Purpose',
        content: (profileData: any, userData: any) => [
          `The purpose of this ${
            profileData?.company__type || 'N/A'
          } is to engage in the following activities: ${profileData?.company__purpose || 'N/A'}.`,
        ],
      },
      {
        header: 'Address',
        content: (profileData: any, userData: any) => [
          `Principal Office: The principal office of the ${
            profileData?.company__type || 'N/A'
          } is located at ${profileData?.company__address || 'N/A'}`,
        ],
      },
      {
        header: 'Members',
        content: (profileData: any, userData: any) => [
          `The initial member(s) of this ${
            profileData?.company__type || 'N/A'
          } are (as Name, ID, Role)`,
          userData?.map((user: any, idx: any) => {
            const roles = [...user.roles]
            if (user.shares > 0) {
              roles.push('shareholder')
            }
            return `${user.name} (ID: ${user.wallet__address})${
              roles.length > 0 ? ' - ' : ''
            }${roles.join(', ')}`
          }),
        ],
      },
      {
        header: 'Management',
        content: (profileData: any, userData: any) => [
          `The ${profileData?.company__type || 'N/A'} shall be managed by  its members.`,
        ],
      },
      {
        header: 'Shares',
        content: (profileData: any, userData: any) => {
          let totalShares = 0
          userData.forEach((x: any) => {
            totalShares += Number(x.shares)
          })
          return [
            `The aggregate number of shares which this ${profileData?.company__type} shall be issuing is: ${totalShares} shares of common stock, without par value.`,
            `The initial shares allocation are as follows: `,

            userData?.map((user: any) => {
              const ownership = ((user.shares / totalShares) * 100).toFixed(2)
              return `${user.name} - ${user.shares} shares, ${ownership ? ownership : 0}% ownership`
            }),
          ]
        },
      },
      {
        header: 'Capital Contributions',
        content: (profileData: any, userData: any) => {
          let totalShares = 0
          userData.forEach((x: any) => {
            totalShares += x.shares
          })
          return [
            `Initial Contributions: The initial capital contributions of the members are as follows:`,
            userData?.map((user: any) => {
              const ownership = (user.shares / totalShares) * 100
              return `${user.name} - ${user?.capital || '0'} ${
                profileData?.capitalCurrency || 'USD'
              }`
            }),
          ]
        },
      },
      {
        header: 'Amendment',
        content: (profileData: any, userData: any) => [
          `This constitution may be amended or repealed by consent of all members`,
        ],
      },
      {
        header: 'Indemnification',
        content: (profileData: any, userData: any) => [
          `The members of the ${
            profileData?.company__type || 'N/A'
          } are not personally liable for the acts or debts of the  ${
            profileData?.company__type || 'N/A'
          }. The ${profileData?.company__type || 'N/A'} shall indemnify its members and managers.`,
        ],
      },
      {
        header: 'Distributions',
        content: (profileData: any, userData: any) => [
          `Distributions of cash, profit or other assets shall be made to members in proportion to their ownership interests, at such times as determined by the members.`,
        ],
      },
      {
        header: 'Additional Terms',
        content: (profileData: any, userData: any) => [`${profileData.company__additional__terms}`],
      },
    ],
  },

  'Model 2': {
    title: 'Articles of Incorporation',
    sections: [
      {
        header: 'Name',
        content: (profileData: any, userData: any) => [
          `The name of the ${profileData?.company__type || 'N/A'} is ${
            profileData?.company__name || 'N/A'
          }.`,
        ],
      },
      {
        header: 'Duration',
        content: (profileData: any, userData: any) => [
          `The ${profileData?.company__type || 'N/A'}’s activities begin on ${
            profileData?.company__formation__date?.split('/')?.reverse()?.join('-') || 'N/A'
          }, and its duration shall be perpetual.`,
        ],
      },
      {
        header: 'Purpose',
        content: (profileData: any, userData: any) => [
          `The purpose of this ${
            profileData?.company__type || 'N/A'
          } is to engage in the following activities: ${profileData?.company__purpose || 'N/A'}.`,
        ],
      },
      {
        header: 'Address',
        content: (profileData: any, userData: any) => [
          `Main Office: The main office of the ${
            profileData?.company__type || 'N/A'
          } is located at ${profileData?.company__address || 'N/A'}`,
        ],
      },
      {
        header: 'Quotaholder',
        content: (profileData: any, userData: any) => [
          `The initial quotaholders of this ${
            profileData?.company__type || 'N/A'
          } are (as Name, ID, Role)`,

          userData?.map((user: any) => {
            const roles = [...user.roles]
            if (user.shares > 0) {
              roles.push('quotaholder')
            }
            return `${user.name} (ID: ${user.wallet__address})${
              roles.length > 0 ? ' - ' : ''
            }${roles.join(', ')}`
          }),
        ],
      },
      {
        header: 'Management',
        content: (profileData: any, userData: any) => [
          `The ${profileData?.company__type || 'N/A'} shall be managed by its administrators.`,
        ],
      },
      {
        header: 'Quotas',
        content: (profileData: any, userData: any) => {
          let totalShares = 0
          userData.forEach((x: any) => {
            totalShares += Number(x.shares)
          })
          return [
            `The aggregate number of quotas which this ${profileData?.company__type} shall be issuing is: ${totalShares} quotas of common stock, without par value.`,
            `The initial quotas allocation are as follows: `,
            userData?.map((user: any) => {
              const ownership = ((user.shares / totalShares) * 100).toFixed(2)
              return `${user.name} - ${user.shares} quotas, ${ownership ? ownership : 0}% ownership`
            }),
          ]
        },
      },
      {
        header: 'Capital Contributions',
        content: (profileData: any, userData: any) => {
          let totalShares = 0
          userData.forEach((x: any) => {
            totalShares += x.shares
          })
          return [
            `Initial Contributions: The initial capital contributions of the quotaholders are as follows:`,

            userData?.map((user: any) => {
              const ownership = (user.shares / totalShares) * 100
              return `${user.name} - ${user?.capital || '0'} ${
                profileData?.capitalCurrency || 'USD'
              }`
            }),
          ]
        },
      },
      {
        header: 'Amendment',
        content: (profileData: any, userData: any) => [
          `This constitution may be amended or repealed by consent of all quotaholders`,
        ],
      },
      {
        header: 'Indemnification',
        content: (profileData: any, userData: any) => [
          `The quotaholders of the ${
            profileData?.company__type || 'N/A'
          } are not personally liable for the acts or debts of the  ${
            profileData?.company__type || 'N/A'
          }. The ${
            profileData?.company__type || 'N/A'
          } shall indemnify its quotaholders and administrators.`,
        ],
      },
      {
        header: 'Distributions',
        content: (profileData: any, userData: any) => [
          `Distributions of cash, profit or other assets shall be made to quotaholders in proportion to their ownership interests, at such times as determined by the quotaholders.`,
        ],
      },
      {
        header: 'Additional Terms',
        content: (profileData: any, userData: any) => [`${profileData.company__additional__terms}`],
      },
    ],
  },
}

// Render the document
const Constitution = ({
  formationData,
  model,
  setModel,
  breakpoints,
  multisigAddress = '',
  canDownload = false,
}: any) => {
  const [viewConst, setViewConst] = useState<any>(true)
  console.log('MODEL', model)

  const metadata: any = {}
  Object.keys(formationData)
    .filter((x) => !x.includes('company__') && x !== 'partners')
    .forEach((field) => {
      metadata[field] = formationData[field].setValue
    })

  metadata.multisigAddress = multisigAddress
  const companyLevelData: any = {}
  Object.keys(formationData)
    .filter((x) => x.includes('company__'))
    .forEach((field) => {
      companyLevelData[field] = formationData[field].setValue
    })

  const userData = formationData.partners
    .filter((partner: any) => !!partner.name.setValue)
    .map((partner: any) => {
      const returnObj: any = {}
      Object.keys(partner).forEach((field) => {
        returnObj[field] = partner[field].setValue
      })
      return returnObj
    })
  // Object.keys(formationData).forEach((field: any) => {
  //   try {
  //     if (field !== 'partners'){
  //       companyObj[field]
  //     }

  // if (field.key.includes('company__')) {
  //   const key = field.key.split('company__').join('')
  //   companyObj[key] = field.value
  // } else if (field.key.includes('partner__[')) {
  //   const splitData = field.key.split('partner__[').join('').split(']__')
  //   if (!users[splitData[0]]) {
  //     users[splitData[0]] = { roles: [] }
  //   }
  //   let key = splitData[1]
  //   if (key.includes('is__')) {
  //     key = key.split('is__').join('')
  //     if (!!key && key !== '' && field.value === 'true') {
  //       users[splitData[0]].roles.push(key)
  //     }
  //   } else {
  //     users[splitData[0]][key] = field.value
  //   }
  // } else {
  //   metadata[field.key] = field.value
  // }
  // } catch (err) {}
  // })

  let downloadable = canDownload
  downloadable = metadata.status === 'APPROVED' || metadata.status === 'SUBMITTED'
  console.log('MODEL?', model)
  if (!model?.setValue) return null
  // Add model selection dropdown
  // Add option buttons below PDF build to display JSON, download pdf, etc
  const constitutionDocument = (
    <Document>
      <Page size="A4" style={stylesPDF.page}>
        {buildConstitution(companyLevelData, userData, model?.setValue, metadata)}
      </Page>
    </Document>
  )
  return (
    <>
      {/* <Button onClick={() => setViewConst(!viewConst)}>Show Constitution</Button> */}
      {setModel !== null ? (
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '12px',
          }}
        >
          <LegacyDropdown
            style={{ width: '350px', textAlign: 'right' }}
            inheritContentWidth={true}
            size={'medium'}
            label={'Constitution: ' + model?.setValue}
            items={Object.keys(constitutionModel)?.map((x: any) => ({
              label: x,
              color: 'blue',
              onClick: () => setModel(x),
              value: x,
            }))}
          />
        </div>
      ) : null}

      {viewConst ? (
        <>
          {buildConstitutionView(companyLevelData, userData, model?.setValue, metadata)}
          {downloadable ? (
            <PDFDownloadLink
              fileName={formationData.name?.setValue || 'company' + '-ArticlesOfIncorporation'}
              document={constitutionDocument}
            >
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  margin: '12px 0',
                }}
              >
                <Button
                  style={{
                    width: breakpoints.xs && !breakpoints.sm ? '100%' : '350px',
                    textAlign: 'right',
                  }}
                >
                  Download Constitution PDF
                </Button>
              </div>
            </PDFDownloadLink>
          ) : null}
        </>
      ) : null}
    </>
  )
}

export default Constitution
