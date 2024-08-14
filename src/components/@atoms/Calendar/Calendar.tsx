import { ForwardedRef, forwardRef, InputHTMLAttributes } from 'react'
import styled, { css } from 'styled-components'

import CalendarSVG from '@app/assets/Calendar.svg'
import { useDefaultRef } from '@app/hooks/useDefaultRef'
import { secondsToDate, secondsToDateInput } from '@app/utils/date'
import { formatExpiry } from '@app/utils/utils'

const Label = styled.label<{ $highlighted?: boolean }>(
  ({ theme, $highlighted }) => css`
    position: relative;
    flex: 1;
    border: 1px solid ${theme.colors.border};
    border-radius: 20px;
    background-color: white;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: ${theme.space['11']};
    text-align: center;
    color: black;
    opacity: 1;
    transition: background-color 150ms ease-in-out;
    padding: ${theme.space['4']} ${theme.space['4']} ${theme.space['4']} ${theme.space['8']};
    :hover {
      background-color: ${theme.colors.blueSurface};
    }
  `,
)

const CalendarIcon = styled.span(
  ({ theme }) => css`
    background-color: ${theme.colors.bluePrimary};
    color: ${theme.colors.textAccent};
    height: ${theme.space['12']};
    width: ${theme.space['12']};
    border-radius: ${theme.radii.full};
    padding: ${theme.space['1']};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  `,
)

const LabelInput = styled.input(
  () => css`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  `,
)

type InputProps = InputHTMLAttributes<HTMLInputElement>
type Props = {
  highlighted?: boolean
  value: number
  unit?: string
  name?: string
  labelText?: string
  min?: number
  labelHeight?: number
} & Omit<InputProps, 'value' | 'defaultValue' | 'min' | 'max' | 'name'>

export const Calendar = forwardRef(
  (
    { value, name, onBlur, highlighted, min, onChange, labelText, labelHeight=82, ...props }: Props,
    ref: ForwardedRef<HTMLInputElement>,
  ) => {
    const inputRef = useDefaultRef<HTMLInputElement>(ref)

    return (<>
        <span style={{padding: "0 8px", color: "hsl(240 6% 63%)", fontSize: "16px", font: "satoshi", fontWeight: "700"}}>{labelText}</span>
      <Label style={{height:labelHeight, padding: "8px 14px", fontSize: "16px"}} htmlFor="calendar" $highlighted={highlighted}>
        <LabelInput
          style={{borderRadius: "20px",backgroundColor: "white"}}
          id="calendar"
          data-testid="calendar"
          type="date"
          {...props}
          ref={inputRef}
          value={"secondsToDateInput(value)"}
          min={secondsToDateInput(min ?? value)}
          onFocus={(e) => {
            e.target.select()
          }}
          onChange={(e) => {
            if (!onChange) return
            
            let { valueAsDate: newValueAsDate } = e.currentTarget
            if (newValueAsDate) {
              // Have to add in the timezone offset to make sure that the date shows up correctly after calendar picking for UTC
              newValueAsDate = new Date(
                newValueAsDate.getTime() + newValueAsDate.getTimezoneOffset() * 60 * 1000,
              )
            }
            onChange({ ...e, currentTarget: { ...e.currentTarget, valueAsDate: newValueAsDate } })
          }}
          onClick={() => inputRef.current!.showPicker()}
        />
        <span data-testid="calendar-date">{formatExpiry(secondsToDate(value))}</span>
        <CalendarIcon>
          <CalendarSVG height={16} width={16} />
        </CalendarIcon>
      </Label>
          </>
    )
  },
)
