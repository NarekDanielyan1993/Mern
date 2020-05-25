import React from 'react';
import {styled} from "styled-components"

import "./Button.css";

const Button = styled.button`
  display: inline-block;
  color: parakit;
  border-color: #ddd;
  border-radius: 3px;
  cursor: pointer;
  background: transparent;
  transition: 0.3s;

  &:hover {
    color: white;
  }
  `

function Button(props) {
    return  (
        <Button className={} onClick={click}>
            {props.children}
        </Button>
    )
}

export default Button;
