import { Button } from '@ensdomains/thorin'

import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'

import contractAddresses from '../../../../../../constants/contractAddresses.json'

const ActionsProposal = ({ refetchTx, setErrorMessage, multisigAddress, wallet, name }: any) => {
  const router = useRouterWithHistory()
  const makeAmendment = async () => {
    router.push('/entity/amend/' + name)
  }

  return (
    <div style={{ width: '50%', margin: '16px 0' }}>
      <Button onClick={() => makeAmendment()}>Make Amendment</Button>
    </div>
  )
}

export default ActionsProposal
