import styled, { css } from 'styled-components'

import { Button, FileInput, Typography } from '@ensdomains/thorin'

const ButtonWrapper = styled.div(
  ({ theme }) => css`
    position: relative;
    cursor: pointer;

    display: flex;

    width: 100%;
    text-align: center;
    border-radius: 8px;
    font-weight: 700;
    border-width: 1px;
    border-style: solid;
    background: #3888ff;
    color: white;
    border-color: transparent;
    font-size: 1rem;
    line-height: 1.25rem;
    height: 3rem;
  `,
)
const DocumentUpload = ({ setBusinessDoc }: any) => {
  return (
    <FileInput accept=".pdf" onChange={(x) => setBusinessDoc(x)}>
      {(context) =>
        context.name ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography style={{ marginRight: '18px' }}>{context.name}</Typography>
            <div style={{}}>
              <Button
                style={{ width: '30px', padding: 0, height: '30px', borderRadius: '6px' }}
                onClick={context.reset as any}
              >
                X
              </Button>
            </div>
          </div>
        ) : (
          <ButtonWrapper>
            <span
              style={{
                display: 'flex',
                textAlign: 'center',
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              Upload
            </span>
          </ButtonWrapper>
        )
      }
    </FileInput>
  )
}

export default DocumentUpload
