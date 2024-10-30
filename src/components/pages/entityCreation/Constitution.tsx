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
    padding: 20,
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

const buildConstitutionView = (profileData: any, userData: any, templateId: any) => {
  const constitutionHeader = (
    <div key="constheader" style={styles.constitutionHeader}>
      <div style={styles.headerTitle}>
        {profileData.name}, {profileData.type}
      </div>
      <div style={styles.headerSubtitle}>Certificate of Formation</div>
    </div>
  )

  const constitutionContent = constitutionTemplate[templateId].map((section: any, idx: number) => {
    const contentArray = section.content(profileData, userData)
    let subSectionCount = 0

    return (
      <div key={section.header} style={styles.section}>
        <div style={styles.sectionHeader}>
          {idx + 1}. {section.header}
        </div>

        {contentArray.map((item: any, index: number) => {
          if (typeof item === 'string') {
            subSectionCount += 1
            return (
              <div key={index} style={styles.listItem}>
                {idx + 1}.{subSectionCount} {item}
              </div>
            )
          } else if (Array.isArray(item)) {
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
  })

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '2px black solid',
        maxHeight: '700px',
        overflowY: 'scroll',
      }}
    >
      {constitutionHeader}
      {constitutionContent}
    </div>
  )
}

// Function to build the constitution sections
const buildConstitution = (profileData: any, userData: any, templateId: any) => {
  const constitutionHeader = (
    <View key={'constheader'} style={{ marginTop: 30, marginBottom: 35, textAlign: 'center' }}>
      <Text style={{ fontSize: 25, fontWeight: 'extrabold' }}>
        {profileData.name}, {profileData.type}
      </Text>
      <Text style={{ fontSize: 18, fontWeight: 'extrabold' }}>Certificate of Formation</Text>
    </View>
  )
  const constitutionContent = constitutionTemplate[templateId].map((section: any, idx: any) => {
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

  return [constitutionHeader, ...constitutionContent]
}

const constitutionTemplate: any = {
  default: [
    {
      header: 'Name',
      content: (profileData: any, userData: any) => [
        `The name of the ${profileData?.type || 'N/A'} is ${profileData?.name || 'N/A'}.`,
      ],
    },
    {
      header: 'Duration',
      content: (profileData: any, userData: any) => [
        `The ${profileData?.type || 'N/A'}’s activities begin on ${
          profileData?.formation__date || 'N/A'
        }, and its duration shall be perpetual.`,
      ],
    },
    {
      header: 'Purpose',
      content: (profileData: any, userData: any) => [
        `The purpose of this ${
          profileData?.type || 'N/A'
        } is to engage in the following activities: ${profileData?.purpose || 'N/A'}.`,
      ],
    },
    {
      header: 'Address',
      content: (profileData: any, userData: any) => [
        `Principal Office: The principal office of the ${
          profileData?.type || 'N/A'
        } is located at ${profileData?.address || 'N/A'}`,
      ],
    },
    {
      header: 'Members',
      content: (profileData: any, userData: any) => [
        `The initial member(s) of this ${profileData?.type || 'N/A'} are (as Name, ID, Role)`,
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
        `The ${profileData?.type || 'N/A'} shall be managed by  its members.`,
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
          `The aggregate number of shares which this ${profileData?.type} shall be issuing is: ${totalShares} shares of common stock, without par value.`,
          `The initial shares allocation are as follows: `,

          userData?.map((user: any) => {
            const ownership = (user.shares / totalShares) * 100
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
            return `${user.name} - ${user?.capital || '0'} ${profileData?.capitalCurrency || 'USD'}`
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
          profileData?.type || 'N/A'
        } are not personally liable for the acts or debts of the  ${
          profileData?.type || 'N/A'
        }. The ${profileData?.type || 'N/A'} shall indemnify its members and managers.`,
      ],
    },
    {
      header: 'Distributions',
      content: (profileData: any, userData: any) => [
        `Distributions of cash, profit or other assets shall be made to members in proportion to their ownership interests, at such times as determined by the members.`,
      ],
    },
  ],

  alternative: [
    {
      header: 'Name',
      content: (profileData: any, userData: any) => [
        `The name of the ${profileData?.type || 'N/A'} is ${profileData?.name || 'N/A'}.`,
      ],
    },
    {
      header: 'Duration',
      content: (profileData: any, userData: any) => [
        `The ${profileData?.type || 'N/A'}’s activities begin on ${
          profileData?.formation__date || 'N/A'
        }, and its duration shall be perpetual.`,
      ],
    },
    {
      header: 'Purpose',
      content: (profileData: any, userData: any) => [
        `The purpose of this ${
          profileData?.type || 'N/A'
        } is to engage in the following activities: ${profileData?.purpose || 'N/A'}.`,
      ],
    },
    {
      header: 'Address',
      content: (profileData: any, userData: any) => [
        `Main Office: The main office of the ${profileData?.type || 'N/A'} is located at ${
          profileData?.address || 'N/A'
        }`,
      ],
    },
    {
      header: 'Members',
      content: (profileData: any, userData: any) => [
        `The initial members of this ${profileData?.type || 'N/A'} are (as Name, ID, Role)`,

        userData?.map((user: any) => {
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
        `The ${profileData?.type || 'N/A'} shall be managed by its members.`,
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
          `The aggregate number of shares which this ${profileData?.type} shall be issuing is: ${totalShares} shares of common stock, without par value.`,
          `The initial shares allocation are as follows: `,
          userData?.map((user: any) => {
            const ownership = (user.shares / totalShares) * 100
            return `${user.name} - ${user.shares} shares, ${ownership ? ownership : 0}% ownership`
          }),
          // Alice Smith , 700000 shares, 70% ownership
          // Bob Johnson , 300000 shares, 30% ownership
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
            return `${user.name} - ${user?.capital || '0'} ${profileData?.capitalCurrency || 'USD'}`
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
          profileData?.type || 'N/A'
        } are not personally liable for the acts or debts of the  ${
          profileData?.type || 'N/A'
        }. The ${profileData?.type || 'N/A'} shall indemnify its members and managers.`,
      ],
    },
    {
      header: 'Distributions',
      content: (profileData: any, userData: any) => [
        `Distributions of cash, profit or other assets shall be made to members in proportion to their ownership interests, at such times as determined by the members.`,
      ],
    },
  ],
}

// Render the document
const Constitution = ({
  formationData,
  template,
  setTemplate,
  breakpoints,
  canDownload = false,
}: any) => {
  const companyObj: any = {}
  const users: any = {}
  formationData.forEach((field: any) => {
    try {
      if (field.key.includes('company__')) {
        const key = field.key.split('company__').join('')
        companyObj[key] = field.value
      }
      if (field.key.includes('partner__[')) {
        const splitData = field.key.split('partner__[').join('').split(']__')
        if (!users[splitData[0]]) {
          users[splitData[0]] = { roles: [] }
        }
        let key = splitData[1]
        if (key.includes('is__')) {
          key = key.split('is__').join('')
          if (!!key && key !== '' && field.value === 'true') {
            users[splitData[0]].roles.push(key)
          }
        } else {
          users[splitData[0]][key] = field.value
        }
      }
    } catch (err) {}
  })

  const [viewConst, setViewConst] = useState<any>(true)

  // Add template selection dropdown
  // Add option buttons below PDF build to display JSON, download pdf, etc
  const constitutionDocument = (
    <Document>
      <Page size="A4" style={stylesPDF.page}>
        {buildConstitution(
          companyObj,
          Object.values(users).filter((x: any) => !!x.name),
          template,
        )}
      </Page>
    </Document>
  )
  return (
    <>
      {/* <Button onClick={() => setViewConst(!viewConst)}>Show Constitution</Button> */}
      {setTemplate !== null ? (
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
            label={'Constitution Template: ' + template}
            items={Object.keys(constitutionTemplate)?.map((x: any) => ({
              label: x,
              color: 'blue',
              onClick: () => setTemplate(x),
              value: x,
            }))}
          />
        </div>
      ) : null}

      {viewConst ? (
        <>
          {buildConstitutionView(
            companyObj,
            Object.values(users).filter((x: any) => !!x.name),
            template,
          )}
          {canDownload ? (
            <PDFDownloadLink
              fileName={
                formationData.find((x: any) => x.key === 'name')?.value ||
                'company' + '-ArticlesOfIncorporation'
              }
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
