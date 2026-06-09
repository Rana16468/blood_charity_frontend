import  { useState } from 'react';
import CameraComponent from './CameraComponent';
import * as faceapi from 'face-api.js';

const students = [
  { id: 1, name: 'John Doe', descriptor: null },
  { id: 2, name: 'Jane Smith', descriptor: null },
  // Add more students
];

const AttendanceComponent = () => {
  const [attendance, setAttendance] = useState({});

  const onFacesDetected = (detections) => {
    const updatedAttendance = { ...attendance };

    students.forEach(student => {
      const match = detections.find(detection => 
        faceapi.euclideanDistance(detection.descriptor, student.descriptor) < 0.6
      );
      if (match) {
        updatedAttendance[student.id] = 'Present';
      }
    });

    setAttendance(updatedAttendance);
  };

  return (
    <div className="p-4">
      <CameraComponent onFacesDetected={onFacesDetected} />
      <div className="mt-4">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Student</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{attendance[student.id] || 'Absent'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceComponent;
