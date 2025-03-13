import styled from "styled-components"
import { Outlink } from "./Outlink"
import { css } from "styled-components"
import { Spinner, Typography } from "@ensdomains/thorin"
import { useEffect, useMemo, useRef, useState } from "react"
import { makeEtherscanLink } from "@app/utils/utils"
import { Card } from "./Card"
import { useEnsHistory } from "@app/hooks/useEnsHistory"
import { namehash } from "viem"

const TransactionSectionContainer = styled.div<{
  $height: string
}>(
  ({ $height }) => css`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    overflow: hidden;
    height: ${$height};
    transition: 0.2s all ease-in-out;
    justify-content: flex-end;
    background-color: transparent;
  `,
)

const TransactionSectionInner = styled.div(
  () => css`
    width: 100%;
    display: flex;
    flex-direction: column;
  `,
)

const RecentTransactionsMessage = styled(Typography)(
  ({ theme }) => css`
    display: flex;
    justify-content: center;
    color: ${theme.colors.textTertiary};
    padding: ${theme.space['4']};
  `,
)

const TransactionContainer = styled(Card)(
  ({ theme, onClick }) => css`
    width: 100%;
    min-height: ${theme.space['18']};
    padding: ${theme.space['3']} 0;
    flex-direction: row;
    justify-content: space-between;
    gap: ${theme.space['3']};
    flex-gap: ${theme.space['3']};
    border: none;
    border-bottom: 1px solid ${theme.colors.border};
    border-radius: ${theme.radii.none};

    ${onClick &&
    css`
      cursor: pointer;
    `}

    &:last-of-type {
      border: none;
    }
  `,
)

const TransactionInfoContainer = styled.div(
  ({ theme }) => css`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: ${theme.space['0.5']};
  `,
)

const StyledOutlink = styled(Outlink)<{ $error: boolean }>(
  ({ theme, $error }) =>
    $error &&
    css`
      > div {
        color: ${theme.colors.red};
      }
      color: ${theme.colors.red};
    `,
)


const InfoContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${theme.space['2']};
  `,
)

export const HistoryBox = ({ record }: any) => {
  const { history, fetchEnsHistory } = useEnsHistory()
  const onOffChainHistory = useMemo(() => {
    return [...(record?.changeLogs || []), ...history].sort((a, b) => a.timestamp - b.timestamp)
  }, [record, history])

  const [historyOpenIndex, setHistoryOpenIndex] = useState<any>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (record?.domain) {
      fetchEnsHistory(namehash(record?.domain))
    }
  }, [record])

  return (
    <TransactionSectionContainer $height={'auto'} data-testid="transaction-section-container">
      <TransactionSectionInner ref={ref}>

        <Typography weight="bold" style={{ textAlign: "left", width: "100%", fontSize: "24px", height: "24px" }}>Change Log</Typography>
        {onOffChainHistory.length > 0 ? (
          <>
            {onOffChainHistory.map(({ hash, status, sourceFunction, changedProperties, timestamp, }: any, i: any) => {
              return (
                <TransactionContainer
                  data-testid={`transaction-${status}`}
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${sourceFunction}-${i}`}
                  onClick={() => {
                    if (historyOpenIndex === i) {
                      setHistoryOpenIndex(null)
                    } else {
                      setHistoryOpenIndex(i)
                    }
                  }
                  }
                >
                  <div style={{ display: "flex", flexDirection: "column", width: "80%", marginLeft: "8px", paddingBottom: "2px", borderBottom: "1px solid black" }}>
                    <InfoContainer>
                      {status === 'pending' && (
                        <Spinner data-testid="pending-spinner" color="accent" />
                      )}
                      <TransactionInfoContainer>
                        <Typography weight="bold">{sourceFunction}</Typography>
                        <Typography weight="bold">{(new Date(timestamp)).toLocaleString()}</Typography>

                        {hash ? <StyledOutlink
                          $error={status === 'failed'}
                          href={makeEtherscanLink(hash, 'sepolia')}
                          target="_blank"
                        >
                          Success
                        </StyledOutlink> : null}
                      </TransactionInfoContainer>
                    </InfoContainer>
                    {historyOpenIndex === i ? <div style={{ fontSize: "11px", marginLeft: "32px", marginTop: "12px" }}>

                      <pre>{JSON.stringify(changedProperties, null, 2)}</pre>
                    </div> : null}

                  </div>


                </TransactionContainer>
              )
            })}
          </>
        ) : (
          <RecentTransactionsMessage weight="bold">
            No Recent Transactions
          </RecentTransactionsMessage>
        )}
      </TransactionSectionInner>
    </TransactionSectionContainer>

  )

}