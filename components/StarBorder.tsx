import type { CSSProperties, ElementType, ReactNode } from "react";

import styles from "./StarBorder.module.css";

type StarBorderProps = {
  as?: ElementType;
  className?: string;
  contentClassName?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  children: ReactNode;
  style?: CSSProperties;
} & Record<string, unknown>;

const StarBorder = ({
  as: Component = "button",
  className = "",
  contentClassName = "",
  color = "white",
  speed = "6s",
  thickness = 1,
  children,
  style,
  ...rest
}: StarBorderProps) => {
  return (
    <Component
      className={`${styles.starBorderContainer} ${className}`.trim()}
      style={{
        padding: `${thickness}px 0`,
        ...style,
      }}
      {...rest}
    >
      <div
        className={styles.borderGradientBottom}
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className={styles.borderGradientTop}
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className={`${styles.innerContent} ${contentClassName}`.trim()}>{children}</div>
    </Component>
  );
};

export default StarBorder;
