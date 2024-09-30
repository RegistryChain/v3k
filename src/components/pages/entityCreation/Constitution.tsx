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
  const constitutionContent = constitutionTemplate[templateId].map((section: any) => {
    const contentArray = section.content(profileData, userData)

    return (
      <View key={section.header} style={{ marginBottom: 15 }}>
        {/* Render the section header */}
        <Text style={styles.header}>{section.header}</Text>

        {/* Map over the contentArray to generate Text elements */}
        {contentArray.map((item: any, index: any) => {
          if (typeof item === 'string') {
            // If it's a string, render it as a list item
            return (
              <Text key={index} style={styles.text}>
                {item}
              </Text>
            )
          } else if (Array.isArray(item)) {
            // If it's an array, render each sub-list item
            return item.map((subItem, subIndex) => (
              <Text key={`${index}-${subIndex}`} style={styles.subListItem}>
                {subItem}
              </Text>
            ))
          }
          return null
        })}
      </View>
    )
  })

  return constitutionContent
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
            return `${user.name} - ID: ${user.address}. Roles: ${roles.join(', ')}`
          }),
        ],
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
