import MoveTopButton from "components/MoveTopButton"
import React from "react"
import styled from "styled-components"

const BodyWrapper = styled.div`
  margin: 0 auto;
  padding-top: 80px;
  max-width: 680px;
`

const Body = ({ children }) => {
  return <BodyWrapper>
      {children}
    <MoveTopButton />
    </BodyWrapper>
}

export default Body
