import React, { memo } from 'react'
import { ProjectList } from './ProjectList'

type Props = {
  isDevWindow: boolean
}

function Core(_props: Props) {
  return <ProjectList />
}

export default memo(Core)
