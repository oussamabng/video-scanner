// src/presentation/components/scanner/ScannerFrame.jsx

import React from 'react';
import { StyleSheet, View } from 'react-native';

const DEFAULT_RADIUS = 4;

export default function ScannerFrame({
  width,
  height,
  children,
  variant = 'brackets',
  accentColor = 'rgba(255,255,255,0.9)',
  guideColor = 'rgba(255,255,255,0.20)',
  radius = DEFAULT_RADIUS,
}) {
  const sizeStyle = [
    styles.container,
    {
      borderRadius: radius,
    },
    width != null ? { width } : null,
    height != null ? { height } : null,
  ];

  const showBrackets = variant !== 'complete';
  const showGuides = variant !== 'complete';

  return (
    <View style={sizeStyle}>
      {variant === 'complete' ? (
        <View
          pointerEvents="none"
          style={[
            styles.completeBorder,
            {
              borderColor: accentColor,
              borderRadius: radius,
            },
          ]}
        />
      ) : null}

      {showGuides ? (
        <>
          <View
            pointerEvents="none"
            style={[styles.guideLine, styles.leftGuide, { backgroundColor: guideColor }]}
          />
          <View
            pointerEvents="none"
            style={[styles.guideLine, styles.rightGuide, { backgroundColor: guideColor }]}
          />
        </>
      ) : null}

      {showBrackets ? (
        <>
          <CornerBracket
            color={accentColor}
            horizontalStyle={styles.topLeftHorizontal}
            verticalStyle={styles.topLeftVertical}
          />
          <CornerBracket
            color={accentColor}
            horizontalStyle={styles.topRightHorizontal}
            verticalStyle={styles.topRightVertical}
          />
          <CornerBracket
            color={accentColor}
            horizontalStyle={styles.bottomLeftHorizontal}
            verticalStyle={styles.bottomLeftVertical}
          />
          <CornerBracket
            color={accentColor}
            horizontalStyle={styles.bottomRightHorizontal}
            verticalStyle={styles.bottomRightVertical}
          />
        </>
      ) : null}

      <View style={styles.content}>{children}</View>
    </View>
  );
}

function CornerBracket({ color, horizontalStyle, verticalStyle }) {
  return (
    <>
      <View pointerEvents="none" style={[styles.cornerBar, { backgroundColor: color }, horizontalStyle]} />
      <View pointerEvents="none" style={[styles.cornerBar, { backgroundColor: color }, verticalStyle]} />
    </>
  );
}

const CORNER_THICKNESS = 4;
const CORNER_LENGTH = 42;
const GUIDE_INSET = CORNER_THICKNESS;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    flex: 1,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  completeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    zIndex: 3,
  },

  guideLine: {
    borderRadius: 999,
    bottom: CORNER_LENGTH,
    position: "absolute",
    top: CORNER_LENGTH,
    width: 1,
    zIndex: 2,
  },
  leftGuide: {
    left: GUIDE_INSET,
  },
  rightGuide: {
    right: GUIDE_INSET,
  },

  cornerBar: {
    borderRadius: 999,
    position: "absolute",
    zIndex: 3,
  },

  topLeftHorizontal: {
    height: CORNER_THICKNESS,
    left: 0,
    top: 0,
    width: CORNER_LENGTH,
  },
  topLeftVertical: {
    height: CORNER_LENGTH,
    left: 0,
    top: 0,
    width: CORNER_THICKNESS,
  },

  topRightHorizontal: {
    height: CORNER_THICKNESS,
    right: 0,
    top: 0,
    width: CORNER_LENGTH,
  },
  topRightVertical: {
    height: CORNER_LENGTH,
    right: 0,
    top: 0,
    width: CORNER_THICKNESS,
  },

  bottomLeftHorizontal: {
    bottom: 0,
    height: CORNER_THICKNESS,
    left: 0,
    width: CORNER_LENGTH,
  },
  bottomLeftVertical: {
    bottom: 0,
    height: CORNER_LENGTH,
    left: 0,
    width: CORNER_THICKNESS,
  },

  bottomRightHorizontal: {
    bottom: 0,
    height: CORNER_THICKNESS,
    right: 0,
    width: CORNER_LENGTH,
  },
  bottomRightVertical: {
    bottom: 0,
    height: CORNER_LENGTH,
    right: 0,
    width: CORNER_THICKNESS,
  },
});
