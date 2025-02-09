import { Tooltip } from '@ensdomains/thorin'

export const CheckmarkSymbol = ({ tooltipText, address }: any) => {
  return (
    <Tooltip content={tooltipText}>
      <div
        style={{
          cursor: 'pointer',
          display: 'inline-block',
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
        <a href={`https://base.easscan.org/address/${address}`}>
        ✔
        </a>
      </div>
    </Tooltip>
  )
}
