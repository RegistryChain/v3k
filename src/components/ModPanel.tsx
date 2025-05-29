import { CheckCircleSVG, DisabledSVG, Tooltip } from "@ensdomains/thorin"
import { FaRegArrowAltCircleUp, FaRegThumbsUp, FaTrash } from "react-icons/fa"

export const ModPanel = ({
    hidden,
    agentDomain,
    connectedIsAdmin,
    moderateEntity
}: any) => {
    let hidingToggle = <Tooltip content={"Hide This Agent"}>
        <div>
            <DisabledSVG style={{ color: "blue", margin: "10px 6px" }} onClick={() => moderateEntity(agentDomain, 1)} />
        </div>
    </Tooltip>

    if (hidden) {
        hidingToggle = <Tooltip content={"Show This Agent"}>
            <div>
                <CheckCircleSVG style={{ color: "lime", margin: "10px 6px" }} onClick={() => moderateEntity(agentDomain, 2)} />
            </div>
        </Tooltip>
    }
    return <>
        {connectedIsAdmin ? (<div style={{ width: "25px", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            {hidingToggle}
            <Tooltip content={"Delete This Agent"}>
                <div>

                    <FaTrash style={{ color: "red", margin: "10px 6px" }} onClick={() => moderateEntity(agentDomain, 3)} />
                </div>
            </Tooltip>
            <Tooltip content={"Toggle Agent Featured"}>
                <div>

                    <FaRegArrowAltCircleUp style={{ color: "black", margin: "10px 6px" }} onClick={() => moderateEntity(agentDomain, 4)} />
                </div>
            </Tooltip>
            <Tooltip content={"Toggle Agent Trending"}>
                <div>

                    <FaRegThumbsUp style={{ color: "gold", margin: "10px 6px" }} onClick={() => moderateEntity(agentDomain, 5)} />
                </div>
            </Tooltip>
        </div>) : null}</>
}