import { Component, OnInit } from '@angular/core';

import {
  CameraResultType,
  FilesystemDirectory,
  CameraPhoto,
  CameraSource,
  Filesystem,
  Camera,
} from '@capacitor/core';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { Observable, Subject } from 'rxjs';

import * as mergeImages from 'merge-images';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  svg = '../../assets/background/purple.png';
  public showWebcam = true;
  public allowCameraSwitch = true;
  public captureImageData = true;
  public multipleWebcamsAvailable = false;
  public deviceId: string;
  public videoOptions: MediaTrackConstraints = {
    width: { ideal: 500 },
    height: { ideal: 700 },
  };
  public errors: WebcamInitError[] = [];

  // latest snapshot
  public webcamImage: WebcamImage = null;

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();
  // switch to next / previous / specific webcam; true/false: forward/backwards, string: deviceId
  private nextWebcam: Subject<boolean | string> = new Subject<
    boolean | string
  >();
  constructor() {}

  public ngOnInit(): void {
    WebcamUtil.getAvailableVideoInputs().then(
      (mediaDevices: MediaDeviceInfo[]) => {
        this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
      }
    );
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
  }

  public handleInitError(error: WebcamInitError): void {
    this.errors.push(error);
  }

  public showNextWebcam(directionOrDeviceId: boolean | string): void {
    // true => move forward through devices
    // false => move backwards through devices
    // string => move to device with given deviceId
    this.nextWebcam.next(directionOrDeviceId);
  }

  public handleImage(webcamImage: WebcamImage): void {
    this.savePicture(webcamImage);
    this.webcamImage = webcamImage;
  }

  public handleImageClick(): void {
    this.triggerSnapshot();
  }

  public cameraWasSwitched(deviceId: string): void {
    console.log('active device: ' + deviceId);
    this.deviceId = deviceId;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get nextWebcamObservable(): Observable<boolean | string> {
    return this.nextWebcam.asObservable();
  }

  selectedSvg(svg) {
    this.svg = svg;
  }

  dataURItoBlob(dataURI: any, fileName: string): File {
    // convert base64/URLEncoded data component to a file
    let byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
      byteString = atob(dataURI.split(',')[1]);
    } else {
      byteString = unescape(dataURI.split(',')[1]);
    }

    // separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new File([ia], fileName, { type: mimeString });
  }

  private async savePicture(webcamImage: WebcamImage) {
    try {
      const fileName = new Date().getTime() + '.jpeg';
      console.log(webcamImage);

      const teste = this.dataURItoBlob(webcamImage.imageAsDataUrl, fileName);

      console.log(teste);

      let savedFile = await Filesystem.writeFile({
        path: fileName,
        data: webcamImage.imageAsBase64,
        directory: FilesystemDirectory.Data,
      });

      console.log(savedFile.uri);
      console.log(savedFile);
      const mergedFileBase64 = await mergeImages([
        savedFile.uri,
        this.svg,
      ]).then((b64) => b64);

      savedFile = await Filesystem.writeFile({
        path: `merge${fileName}`,
        data: mergedFileBase64,
        directory: FilesystemDirectory.Data,
      });

      console.log(savedFile.uri);

      // Use webPath to display the new image instead of base64 since it's
      // already loaded into memory
      return {
        filepath: `merge${fileName}`,
        webviewPath: savedFile.uri,
      };
    } catch (error) {
      alert(error);
    }
  }
}
