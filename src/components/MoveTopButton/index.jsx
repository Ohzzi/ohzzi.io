import React from "react";
import { useState, useEffect } from 'react'
import styled from "styled-components";
import { BsFillArrowUpSquareFill } from 'react-icons/bs'

const Button = styled(BsFillArrowUpSquareFill)`
  margin: 10px;
  right: 10px;
  bottom: 40px;
  position: sticky;
  float: right;
  font-size: 3.2rem;
  color: ${props => props.theme.colors.hoveredNextPostButtonBackground};
  opacity: ${props => (props.isHidden ? 0 : 1)};
  transition: all 0.5s;

  &:hover {
    color: ${props => props.theme.colors.signatureTranslucent};
    cursor: ${props => (props.isHidden? 'default' : 'pointer')};
  }
`;

const MoveTopButton = ({ children }) => {
  const [hidden, setHidden] = useState(true)
  const scrollTop = () => {
    if (!hidden) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const handleShowButton = () => {
      if (window.scrollY > window.innerHeight * 0.2) {
        setHidden(false)
      } else {
        setHidden(true)
      }
    }

    window.addEventListener('scroll', handleShowButton)
    return () => {
      window.removeEventListener('scroll', handleShowButton)
    }
  }, [])

  return (
    <Button isHidden={hidden} onClick={scrollTop}>
      {children}
    </Button>
  );
}

export default MoveTopButton;