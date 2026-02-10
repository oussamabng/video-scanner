// @ts-nocheck
// src/presentation/screens/ReceiptScannerScreen.jsx

import React, { useMemo } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScannerFrame from '../components/scanner/ScannerFrame';
import ScanLine from '../components/scanner/ScanLine';
import ScanProgressBar from '../components/scanner/ScanProgressBar';
import SideSegments from '../components/scanner/SideSegments';
import ScannerAlertBanner from '../components/scanner/ScannerAlertBanner';
import ScannerFooter from '../components/scanner/ScannerFooter';
import ScannerCompleteOverlay from '../components/scanner/ScannerCompleteOverlay';
import { useReceiptScannerController } from '../../application/scanner/useReceiptScannerController';
import VisionCameraAdapter from '../../infrastructure/camera/VisionCameraAdapter';

const SEGMENTS_COUNT = 18;
const SEGMENTS_WIDTH = 34;
const SEGMENTS_OUTSET = 18;
const FRAME_CONTENT_PADDING = 14;
const SCAN_LINE_TOP_OFFSET = 112;
const SCAN_LINE_BOTTOM_INSET = 14;

export default function ReceiptScannerScreen() {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const frameWidth = Math.min(screenWidth * 0.76, 350);
  const frameHeight = Math.min(frameWidth * 2.12, screenHeight * 0.66);

  const {
    uiModel,
    permissionStatus,
    cameraActive,
    onCameraReady,
    startScanning,
    cancelScanning,
    scanAnother,
    viewReceipt,
  } = useReceiptScannerController();

  const scanLineTravelDistance = useMemo(
    () =>
      Math.max(frameHeight - SCAN_LINE_TOP_OFFSET - SCAN_LINE_BOTTOM_INSET, 0),
    [frameHeight],
  );

  const frameVariant = uiModel.isComplete ? 'complete' : 'brackets';

  const frameAccentColor = useMemo(() => {
    if (uiModel.isComplete) return '#22C55E';
    if (uiModel.hasError) return uiModel.colors.error;
    if (uiModel.isScanning) return uiModel.colors.scanning;
    return 'rgba(255,255,255,0.9)';
  }, [
    uiModel.colors.error,
    uiModel.colors.scanning,
    uiModel.hasError,
    uiModel.isComplete,
    uiModel.isScanning,
  ]);

  const segmentsFloatingStyle = useMemo(
    () => ({
      position: 'absolute',
      right: -(SEGMENTS_WIDTH + SEGMENTS_OUTSET),
      top: 0,
    }),
    [],
  );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#050608" />

      <VisionCameraAdapter
        style={StyleSheet.absoluteFill}
        isActive={cameraActive}
        onReady={onCameraReady}
      />
      <View style={styles.dimLayer} pointerEvents="none" />

      <View style={styles.container}>
        <View style={styles.frameRow}>
          <View style={[styles.frameWrapper, { width: frameWidth }]}>
            <View style={[styles.frameSizer, { height: frameHeight }]}>
              <ScannerFrame
                width={frameWidth}
                height={frameHeight}
                variant={frameVariant}
                accentColor={frameAccentColor}
              >
                {!uiModel.isComplete ? (
                  <View pointerEvents="none" style={styles.headerInsideFrame}>
                    <Text style={styles.headerTitle}>{uiModel.title}</Text>
                    <Text style={styles.headerSubtitle}>
                      {uiModel.subtitle}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.frameBody}>
                  <ScanProgressBar
                    progress={uiModel.progress}
                    label={uiModel.isComplete ? null : uiModel.progressLabel}
                    color={uiModel.progressColor}
                  />
                  <ScannerAlertBanner
                    alert={uiModel.hasError ? uiModel.alert : null}
                  />

                  <ScanLine
                    visible={uiModel.showScanLine && !uiModel.isComplete}
                    paused={uiModel.scanLinePaused}
                    color={
                      uiModel.hasError
                        ? uiModel.colors.error
                        : uiModel.colors.scanning
                    }
                    topOffset={SCAN_LINE_TOP_OFFSET}
                    travelDistance={scanLineTravelDistance}
                  />
                </View>

                <ScannerCompleteOverlay
                  visible={uiModel.isComplete}
                  adjustmentsCount={uiModel.adjustmentsCount}
                  style={styles.completeOverlayFull}
                />
              </ScannerFrame>

              <SideSegments
                key={`segments-${uiModel.phase}`}
                progressPct={uiModel.progress}
                activeColor="#22C55E"
                isScanning={uiModel.isScanning}
                isComplete={uiModel.isComplete}
                height={frameHeight}
                segmentsCount={SEGMENTS_COUNT}
                segmentWidth={SEGMENTS_WIDTH}
                segmentHeight={10}
                segmentGap={14}
                style={segmentsFloatingStyle}
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <ScannerFooter
            phase={uiModel.phase}
            permissionStatus={permissionStatus}
            onStartScanning={startScanning}
            onCancelScanning={cancelScanning}
            onViewReceipt={viewReceipt}
            onScanAnother={scanAnother}
          />

          <Text style={styles.tipText}>{uiModel.tip}</Text>

          {permissionStatus === 'denied' ? (
            <Text style={styles.permissionWarning}>
              Camera permission is required to start scanning.
            </Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050608',
  },
  dimLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  container: {
    flex: 1,
  },

  frameRow: {
    flex: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  frameWrapper: {
    alignItems: 'center',
  },
  frameSizer: {
    width: '100%',
    position: 'relative',
  },

  headerInsideFrame: {
    alignItems: 'center',
    paddingTop: -15,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#F6F8FC',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(246, 248, 252, 0.82)',
    fontSize: 14,
    fontWeight: '400',
    marginTop: 6,
    textAlign: 'center',
  },
  frameBody: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  completeOverlayFull: {
    top: -FRAME_CONTENT_PADDING,
    right: -FRAME_CONTENT_PADDING,
    bottom: -FRAME_CONTENT_PADDING,
    left: -FRAME_CONTENT_PADDING,
    borderRadius: 28,
  },

  bottomRow: {
    flex: 2,
    justifyContent: 'flex-end',
    paddingBottom: 14,
  },

  tipText: {
    color: 'rgba(236, 242, 252, 0.86)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  permissionWarning: {
    color: '#FDBA74',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 8,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
});
