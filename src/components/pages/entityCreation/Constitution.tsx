import { Document, Page, PDFViewer, StyleSheet, Text, View } from '@react-pdf/renderer'
import React, { useState } from 'react'

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
const buildConstitution = (profileData, userData, templateId) => {
  console.log(profileData, userData)

  const constitutionContent = constitutionTemplate[templateId].map((section) => {
    const contentArray = section.content(profileData, userData)

    return (
      <View key={section.header} style={{ marginBottom: 15 }}>
        {/* Render the section header */}
        <Text style={styles.header}>{section.header}</Text>

        {/* Map over the contentArray to generate Text elements */}
        {contentArray.map((item, index) => {
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

const constitutionTemplate = {
  '1': [
    {
      header: 'Name',
      content: (profileData, userData) => [
        `The name of the ${profileData?.type || 'N/A'} is ${profileData?.name || 'N/A'}.`,
      ],
    },
    {
      header: 'Duration',
      content: (profileData, userData) => [
        `The ${profileData?.type || 'N/A'}’s activities begin on ${
          profileData?.formationDate || 'N/A'
        }, and its duration shall be perpetual.`,
      ],
    },
    {
      header: 'Purpose',
      content: (profileData, userData) => [
        `The purpose of this ${
          profileData?.type || 'N/A'
        } is to engage in the following activities: ${profileData?.purpose || 'N/A'}.`,
      ],
    },
    {
      header: 'Address',
      content: (profileData, userData) => [
        `Principal Office: The principal office of the ${
          profileData?.type || 'N/A'
        } is located at ${profileData?.address || 'N/A'}`,
      ],
    },
    {
      header: 'Members',
      content: (profileData, userData) => [
        `The initial member(s) of this ${profileData?.type || 'N/A'} are (as Name, ID, Role)`,
        [
          userData?.map((user) => {
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

const fal: boolean | undefined = false
// Render the document
const Constitution = ({ profileData, userData }) => {
  // IMPORTANT - sHOULD THIS COMPONENT TAKE PROFILEDATA IN SAME FORM HELD IN IPFS, AS CONTRACT KEYS? OR SHOULD ASSUME PRIOR PROCESSING INTO NORMAL FORMAT?
  const [viewConst, setViewConst] = useState<any>(false)
  return (
    <>
      <Button onClick={() => setViewConst(!viewConst)}>Show Constitution</Button>
      {viewConst ? (
        <PDFViewer width="100%" height="600" showToolbar={fal}>
          <Document>
            <Page size="A4" style={styles.page}>
              {buildConstitution(profileData, userData, '1')}
            </Page>
          </Document>
        </PDFViewer>
      ) : null}
    </>
  )
}

export default Constitution
