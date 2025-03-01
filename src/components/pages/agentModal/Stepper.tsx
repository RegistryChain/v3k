import * as React from 'react';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import CheckIcon from '@mui/icons-material/Check';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import InfoIcon from '@mui/icons-material/Info';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';


interface CustomizedSteppersProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
}

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  transition: 'background-color 0.3s',
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 13,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.secondary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.secondary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#eaeaf0',
    borderRadius: 1,
    ...theme.applyStyles('dark', {
      backgroundColor: theme.palette.grey[800],
    }),
  },
}));

const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme }) => ({
  backgroundColor: '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 30,
  height: 30,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'background-color 0.3s',
  ...theme.applyStyles('dark', {
    backgroundColor: theme.palette.grey[700],
  }),
  variants: [
    {
      props: ({ ownerState }) => ownerState.active,
      style: {
        backgroundColor: theme.palette.secondary.main,
        boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
      },
    },
    {
      props: ({ ownerState }) => ownerState.completed,
      style: {
        backgroundColor: theme.palette.secondary.main,
      },
    },
  ],
}));


function ColorlibStepIcon({ ...props }: StepIconProps) {
  const { active, completed, className } = props;

  const icons: { [index: string]: React.ReactElement<unknown> } = {
    1: <SettingsIcon />,
    2: <InfoIcon />,
    3: <PersonOutlineIcon />,
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? (
        <CheckIcon className="QontoStepIcon-completedIcon" />
      ) :
        icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

const steps = ['General Info', 'Socials', 'Developer Info'];

export const CustomizedSteppers = ({
  activeStep,
  setActiveStep,
}: CustomizedSteppersProps) => {
  return (
    <Stack sx={{ width: '100%' }} spacing={4}>
      <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
        {steps.map((label, index) => (
          <Step key={label} onClick={() => setActiveStep(index)} style={{ cursor: 'pointer' }}>
            <StepLabel slots={{ stepIcon: ColorlibStepIcon }}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Stack >
  );
}
