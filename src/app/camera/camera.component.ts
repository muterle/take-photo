import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { Observable } from 'rxjs';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss'],
})
export class CameraComponent implements OnInit {
  @Output()
  svg = '../../assets/background/purple.png';

  public pictureTaken = new EventEmitter<WebcamImage>();
  // toggle webcam on/off
  public showWebcam = true;
  public allowCameraSwitch = true;
  public multipleWebcamsAvailable = false;
  public deviceId: string;
  public videoOptions: MediaTrackConstraints = {
    width: { ideal: 500 },
    height: { ideal: 700 },
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

  selectedSvg(svg) {
    this.svg = svg;
  }

  savePicture(webcamImage: WebcamImage) {
    const filename = new Date().getTime() + '.png';
    console.log(filename);

    this.http
      .post(`https://p4d-convert-image.herokuapp.com`, {
        filename,
        base64Image: webcamImage.imageAsBase64,
      })
      .toPromise()
      .then((res) => {
        alert(res);
        return res;
      })
      .catch((error) => alert(error));
  }
  // private async savePicture(webcamImage: WebcamImage) {
  //   try {
  //     const fileName = new Date().getTime() + '.jpeg';
  //     console.log(webcamImage);

  //     const teste = this.dataURItoBlob(webcamImage.imageAsDataUrl, fileName);

  //     console.log(teste);

  //     const savedFile = await Filesystem.writeFile({
  //       path: fileName,
  //       data: webcamImage.imageAsBase64,
  //       directory: FilesystemDirectory.Data,
  //     });

  //     console.log(savedFile.uri);
  //     console.log(savedFile);
  //     // let mergedFileBase64 = null;
  //     // mergeImages([savedFile.uri, this.svg]).then(
  //     //   (b64) => (mergedFileBase64 = b64)
  //     // );

  //     // savedFile = await Filesystem.writeFile({
  //     //   path: `merge${fileName}`,
  //     //   data: mergedFileBase64,
  //     //   directory: FilesystemDirectory.Data,
  //     // });

  //     //console.log(mergedFileBase64);

  //     // Use webPath to display the new image instead of base64 since it's
  //     // already loaded into memory
  //     return {
  //       filepath: fileName,
  //       webviewPath: savedFile.uri,
  //     };
  //   } catch (error) {
  //     alert(error);
  //   }
  // }
}
