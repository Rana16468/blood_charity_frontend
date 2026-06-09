

// const QRCodeScanner = () => {
//     return (
//         <div>
//             <h1>QR Code Scanner</h1>
//         </div>
//     );
// };

// export default QRCodeScanner;

import  { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { RefreshCw, Smartphone, Monitor } from 'lucide-react';

const QRCodeScanner = () => {
  const [qrCode, setQRCode] = useState('');
  const [scanResult, setScanResult] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Generate a new session token every 20 seconds
  useEffect(() => {
    const generateNewToken = () => {
      const token = Math.random().toString(36).substring(2) + 
                   Date.now().toString(36);
      setQRCode(token);
    };

    generateNewToken();
    const interval = setInterval(generateNewToken, 20000);

    return () => clearInterval(interval);
  }, []);

  // Initialize QR scanner
  useEffect(() => {
    let scanner;

    if (isScanning) {
      scanner = new Html5QrcodeScanner('reader', {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
      });

      scanner.render(success, error);

      function success(result) {
        setScanResult(result);
        console.log(result)
        scanner.clear();
        setIsScanning(false);
      }

      function error(err) {
        console.log(err);
        console.warn(err);
      }
    }

    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [isScanning]);

  console.log(scanResult)

  return (
    <div className="flex flex-col md:flex-row gap-8 p-4 w-full max-w-4xl mx-auto">
      {/* QR Code Display Section */}
      <div className="flex-1 bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Monitor className="w-5 h-5" />
            Desktop QR Code
          </h2>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <QRCodeSVG
              value={qrCode}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="text-sm text-gray-500">
            Scan with your mobile device to log in
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Refreshes every 20 seconds</span>
          </div>
        </div>
      </div>

      {/* QR Code Scanner Section */}
      <div className="flex-1 bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Smartphone className="w-5 h-5" />
            Mobile Scanner
          </h2>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          {!isScanning && !scanResult && (
            <button
              onClick={() => setIsScanning(true)}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              Start Scanning
            </button>
          )}
          
          {isScanning && (
            <div id="reader" className="w-full"></div>
          )}
          
          {scanResult && (
            <div className="text-center">
              <p className="mb-4">QR Code detected:</p>
              <code className="bg-gray-100 p-2 rounded">{scanResult}</code>
              <button
                onClick={() => {
                  setScanResult('');
                  setIsScanning(true);
                }}
                className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
              >
                Scan Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;