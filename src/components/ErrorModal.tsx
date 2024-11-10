import { Button, Modal, Typography } from '@ensdomains/thorin'

export const ErrorModal = ({ errorMessage, setErrorMessage, breakpoints }: any) => {
  return (
    <Modal
      style={
        breakpoints.xs && !breakpoints.sm
          ? { width: '100%', top: 0 }
          : { width: '36%', top: '300px' }
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
            height: errorMessage.length > 300 ? '350px' : '240px',
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
            }}
          >
            {errorMessage.length > 450 ? errorMessage.slice(0, 450) + '...' : errorMessage}
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
