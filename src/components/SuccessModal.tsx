import { Button, Modal, Typography } from '@ensdomains/thorin'

export const SuccessModal = ({ open, message, setMessage, breakpoints }: any) => {
    const otherStyles = breakpoints.xs && !breakpoints.sm
        ? { width: '100%', top: 0 }
        : { width: '36%', top: '300px' }
    return (
        <Modal
            style={
                { zIndex: 10001, ...otherStyles }
            }
            onDismiss={() => setMessage("")}
            open={open}

        >
            <div style={{ width: '100%' }}>
                <div
                    style={{
                        borderRadius: '6px',
                        border: '#039e2c solid 1px',
                        backgroundColor: '#96ebad',
                        padding: '40px',
                        width: '100%',
                        height: message?.length > 300 ? '350px' : '240px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography
                        style={{
                            paddingTop: '8px',
                            fontSize: '22px',
                            color: '#039e2c',
                            textAlign: 'center',
                            wordWrap: 'break-word',
                            maxHeight: breakpoints.xs && !breakpoints.sm ? '240px' : '300px',
                            overflowY: message.length > 250 ? 'scroll' : 'hidden',
                        }}
                    >
                        {message}
                    </Typography>

                    <Button
                        style={{ marginTop: '12px', padding: '10px 0' }}
                        colorStyle="greenSecondary"
                        onClick={() => setMessage('')}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </Modal >
    )
}
