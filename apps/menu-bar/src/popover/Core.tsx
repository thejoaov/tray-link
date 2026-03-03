import React, { memo } from "react";
import { View } from "../components";
import { ProjectList } from "./ProjectList";

type Props = {
  isDevWindow: boolean;
};

function Core(_props: Props) {
  return (
    <View>
      <ProjectList />
    </View>
  );
}

export default memo(Core);
