import { Tooltip } from '@ensdomains/thorin'

export const ExclamationSymbol = ({ tooltipText }: any) => {
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
          backgroundColor: 'red',
          color: 'white',
          fontSize: '0.8em',
          fontWeight: 'bold',
          marginLeft: '0.1em', // Optional spacing from the header text
          verticalAlign: 'middle',
          marginRight: '0.5em',
        }}
      >
        !
      </div>
    </Tooltip>
  )
}
