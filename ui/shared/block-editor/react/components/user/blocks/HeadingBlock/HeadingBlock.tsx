/*
 * Copyright (C) 2024 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react'
import ContentEditable from 'react-contenteditable'
import {useEditor, useNode} from '@craftjs/core'
import {Heading} from '@instructure/ui-heading'
import {TextBlock} from '../TextBlock/TextBlock'
import {
  useClassNames,
  shouldAddNewNode,
  shouldDeleteNode,
  addNewNodeAsNextSibling,
  deleteNodeAndSelectPrevSibling,
} from '../../../../utils'
import {HeadingBlockToolbar} from './HeadingBlockToolbar'
import {type HeadingBlockProps, type HeadingLevel} from './types'

export const HeadingBlock = ({text, level}: HeadingBlockProps) => {
  const {actions, query, enabled} = useEditor(state => {
    return {
      enabled: state.options.enabled,
    }
  })
  const {
    connectors: {connect, drag},
    actions: {setProp},
    id,
    selected,
    themeOverride,
  } = useNode(state => ({
    id: state.id,
    selected: state.events.selected,
    themeOverride: state.data.custom.themeOverride,
  }))
  const clazz = useClassNames(enabled, {empty: !text}, ['block', 'heading-block'])
  const focusableElem = useRef<HTMLElement | null>(null)
  const [editable, setEditable] = useState(false)
  const lastChar = useRef<string>('Enter') // so 1 Enter creates a new text node

  useEffect(() => {
    if (editable && selected && focusableElem.current) {
      focusableElem.current.focus()
    }
    setEditable(selected)
  }, [editable, focusableElem, selected])

  const handleChange = useCallback(
    e => {
      setProp((props: HeadingBlockProps) => {
        props.text = e.target.value.replace(/<\/?[^>]+(>|$)/g, '')
      })
    },
    [setProp]
  )

  const handleKey = useCallback(
    e => {
      if (shouldAddNewNode(e, lastChar.current)) {
        e.preventDefault()
        addNewNodeAsNextSibling(<TextBlock text="" />, id, actions, query)
      } else if (shouldDeleteNode(e)) {
        e.preventDefault()
        deleteNodeAndSelectPrevSibling(id, actions, query)
      }
    },
    [actions, id, query]
  )

  const handleClick = useCallback(_e => {
    setEditable(true)
  }, [])

  // TODO: this doesn't work because selectNode selects the section
  //       due to the our behavior that the first select is the section
  //       There's something now right with that logic in RenderNode
  //       Managing selection vs. focus needs work.
  const handleFocus = useCallback(() => {
    //   if (!selected) {
    //     actions.selectNode(id)
    //   }
  }, [])

  if (enabled) {
    return (
      // eslint-disable-next-line jsx-a11y/interactive-supports-focus, jsx-a11y/click-events-have-key-events
      <div
        ref={el => el && connect(drag(el))}
        role="textbox"
        onClick={handleClick}
        className={clazz}
      >
        <Heading level={level} color="primary" themeOverride={themeOverride}>
          <ContentEditable
            innerRef={focusableElem}
            data-placeholder={`Heading ${level?.replace('h', '')}`}
            className={!text ? 'empty' : ''}
            disabled={!editable}
            html={text || ''}
            onChange={handleChange}
            onKeyDown={handleKey}
            onFocus={handleFocus}
            tagName="span"
          />
        </Heading>
      </div>
    )
  } else {
    return (
      <Heading level={level} color="primary" themeOverride={themeOverride}>
        {text}
      </Heading>
    )
  }
}

HeadingBlock.craft = {
  displayName: 'Heading',
  defaultProps: {
    text: '',
    level: 'h2' as HeadingLevel,
  },
  related: {
    toolbar: HeadingBlockToolbar,
  },
  custom: {
    isResizable: true,
  },
}
