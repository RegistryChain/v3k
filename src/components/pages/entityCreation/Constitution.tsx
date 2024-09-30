import { Document, Page, PDFViewer, StyleSheet, Text, View } from '@react-pdf/renderer'
import React, { useMemo, useState } from 'react'

import { Button } from '@ensdomains/thorin'

// Create styles
const styles = StyleSheet.create({
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

    return (
      <View key={section.header} style={{ marginBottom: 15, marginLeft: 15 }}>
        {/* Render the section header */}
        <Text style={styles.header}>
          {idx + 1}. {section.header}
        </Text>

        {/* Map over the contentArray to generate Text elements */}
        {contentArray.map((item: any, index: any) => {
          if (typeof item === 'string') {
            // If it's a string, render it as a list item
            return (
              <Text key={index} style={{ ...styles.text, marginLeft: 20 }}>
                {idx + 1}.{index + 1} {item}
              </Text>
            )
          } else if (Array.isArray(item)) {
            // If it's an array, render each sub-list item
            return item.map((subItem, subIndex) => (
              <Text key={`${index}-${subIndex}`} style={{ ...styles.subListItem, marginLeft: 50 }}>
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
  '1': [
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
          profileData?.formationDate || 'N/A'
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
        [
          userData?.map((user: any) => {
            const roles = [...user.roles]
            if (user.shares > 0) {
              roles.push('shareholder')
            }
            return `${user.name} (ID: ${user.address}) - ${roles.join(', ')}`
          }),
        ],
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
          totalShares += x.shares
        })
        return [
          `The aggregate number of shares which this ${profileData?.type} shall be issuing is: ${totalShares} shares of common stock, without par value.`,
          `The initial shares allocation are as follows: `,
          [
            userData?.map((user: any) => {
              const ownership = (user.shares / totalShares) * 100
              return `${user.name} - ${user.shares} shares, ${ownership}% ownership`
            }),
          ],
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
          [
            userData?.map((user: any) => {
              const ownership = (user.shares / totalShares) * 100
              return `${user.name} - ${user?.capital || '0'} ${
                profileData?.capitalCurrency || 'USD'
              }`
            }),
          ],
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
const Constitution = ({ formationData }: any) => {
  const companyObj: any = {}
  const users: any = {}
  formationData.forEach((field: any) => {
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
        if (!!key && key !== '') {
          users[splitData[0]].roles.push(key)
        }
      } else {
        users[splitData[0]][key] = field.value
      }
    }
  })

  const [viewConst, setViewConst] = useState<any>(true)
  return (
    <>
      {/* <Button onClick={() => setViewConst(!viewConst)}>Show Constitution</Button> */}
      {viewConst ? (
        <PDFViewer width="100%" height="600" showToolbar={true}>
          <Document>
            <Page size="A4" style={styles.page}>
              {buildConstitution(companyObj, Object.values(users), '1')}
            </Page>
          </Document>
        </PDFViewer>
      ) : null}
    </>
  )
}

export default Constitution
