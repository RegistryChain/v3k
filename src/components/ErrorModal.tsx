import { Button, Modal, Typography } from '@ensdomains/thorin'

export const ErrorModal = ({ errorMessage, setErrorMessage, breakpoints }: any) => {
  const otherStyles = breakpoints.xs && !breakpoints.sm
    ? { width: '100%', top: 0 }
    : { width: '36%', top: '300px' }
  return (
    <Modal
      style={
        { zIndex: 10001, ...otherStyles }
      }
      open={!!errorMessage}
    >
      <div style={{ width: '100%' }}>
        <div
          style={{
            borderRadius: '6px',
            border: 'hsl(7 76% 44%) solid 1px',
            backgroundColor: 'rgb(239 169 169)',
            padding: '40px',
            width: '100%',
            height: errorMessage?.length > 300 ? '350px' : '240px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            style={{
              paddingTop: '8px',
              fontSize: '22px',
              color: 'hsl(7 76% 44%)',
              textAlign: 'center',
              wordWrap: 'break-word',
              maxHeight: breakpoints.xs && !breakpoints.sm ? '240px' : '300px',
              overflowY: errorMessage.length > 250 ? 'scroll' : 'hidden',
            }}
          >
            {errorMessage}
          </Typography>

          <Button
            style={{ marginTop: '12px', padding: '10px 0' }}
            colorStyle="redPrimary"
            onClick={() => setErrorMessage('')}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
