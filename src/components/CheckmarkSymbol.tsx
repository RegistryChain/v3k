import { Tooltip } from '@ensdomains/thorin'

export const CheckmarkSymbol = ({ tooltipText }: any) => {
  return (
    <Tooltip content={tooltipText}>
      <div
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '1.2em',
          height: '1.2em',
          borderRadius: '50%',
          backgroundColor: 'green', // Changed from red to green
          color: 'white',
          fontSize: '0.8em',
          fontWeight: 'bold',
          marginLeft: '4px',
          marginTop: '3px',
          verticalAlign: 'middle',
          marginRight: '0.5em',
        }}
      >
        ✔
      </div>
    </Tooltip>
  )
}
