/* eslint-disable @typescript-eslint/naming-convention */
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { Observable } from 'rxjs';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';

import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss'],
})
export class CameraComponent implements OnInit {
  @Output()
  svg = '../../assets/background/black.svg';
  color = 'black';

  public pictureTaken = new EventEmitter<WebcamImage>();
  // toggle webcam on/off
  public showWebcam = true;
  public allowCameraSwitch = true;
  public multipleWebcamsAvailable = false;
  public deviceId: string;
  public videoOptions: MediaTrackConstraints = {
    width: { ideal: 500 },
    height: { ideal: 707 },
  };
  public errors: WebcamInitError[] = [];
  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();
  // switch to next / previous / specific webcam; true/false: forward/backwards, string: deviceId
  private nextWebcam: Subject<boolean | string> = new Subject<
    boolean | string
  >();

  constructor(private http: HttpClient) {}

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
    console.log('received webcam image', webcamImage);
    this.savePicture(webcamImage);
    this.pictureTaken.emit(webcamImage);
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

  selectedSvg(svg, color) {
    this.svg = svg;
    this.color = color;
  }

  async savePicture(webcamImage: WebcamImage) {
    const filename = new Date().getTime() + '.png';
    console.log(filename);

    await this.http
      .post(
        `${environment.urlBase}`,
        {
          color: this.color,
          filename,
          base64Image: webcamImage.imageAsBase64,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .toPromise()
      .then(async (res) => {
        console.log(res);
      })
      .catch(() => {});

    await this.http
      .get(`${environment.urlBase}/download`, {
        headers: { responseType: 'blob' },
        params: { filename },
      })
      .toPromise()
      .then(async (res) => {
        console.log(res);
      })
      .catch((error) => alert('error'));
  }
}
