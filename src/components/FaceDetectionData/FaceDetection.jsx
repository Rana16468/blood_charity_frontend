import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceDetection = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = () => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models').catch(err => console.error('Error loading tinyFaceDetector:', err)),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models').catch(err => console.error('Error loading faceLandmark68Net:', err)),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models').catch(err => console.error('Error loading faceRecognitionNet:', err)),
      faceapi.nets.faceExpressionNet.loadFromUri('/models').catch(err => console.error('Error loading faceExpressionNet:', err))
    ]);
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((currentStream) => {
        videoRef.current.srcObject = currentStream;
        startDetection();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const stopVideo = () => {
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach(track => track.stop());
    videoRef.current.srcObject = null;
  };

  const startDetection = () => {
    const id = setInterval(async () => {
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceExpressions().withFaceDescriptors();

      console.log(detections);

      if (detections.length > 0) {
        const faceData = detections.map(d => d.descriptor);
        console.log(faceData);
      } else {
        alert('No face detected.');
      }

      canvasRef.current.innerHTML = '';
      const canvas = faceapi.createCanvasFromMedia(videoRef.current);
      canvasRef.current.appendChild(canvas);

      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }, 1000);

    setIntervalId(id);
  };

  const stopDetection = () => {
    clearInterval(intervalId);
    stopVideo();
  };

  return (
    <>
      <div className="myapp">
        <h1>Face Detection</h1>
        <div className="appvide">
          <video crossOrigin="anonymous" ref={videoRef} autoPlay muted></video>
        </div>
        <canvas ref={canvasRef} className="appcanvas" />
        <div className="controls">
          <button onClick={startVideo}>Start</button>
          <button onClick={stopDetection}>Close</button>
        </div>
      </div>
    </>
  );
};

export default FaceDetection;
