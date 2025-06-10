import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { WindowService, DynamicData } from '../../services/window.service';
import { Subscription } from 'rxjs';
import * as THREE from 'three';

@Component({
  selector: 'app-window-hublot',
  templateUrl: './window-hublot.page.html',
  styleUrls: ['./window-hublot.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule
  ]
})
export class WindowHublotPage implements OnInit, OnDestroy {
  @ViewChild('container') container!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private skybox!: THREE.Mesh;
  private clouds: THREE.Mesh[] = [];

  private subscriptions: Subscription[] = [];
  private animationFrameId: number = 0;

  dynamicData: DynamicData;
  isLoadingHublot = true;

  constructor(private windowService: WindowService) {
    this.dynamicData = this.windowService.dynamicData.value;
  }

  ngOnInit() {
    // S'abonner aux observables du service
    this.subscriptions.push(
      this.windowService.dynamicData$.subscribe(data => {
        this.updateView(data);
      })
    );
  }

  ngAfterViewInit() {
    this.initScene();
    this.animate();
    this.isLoadingHublot = false;
  }

  ngOnDestroy() {
    // Nettoyer les abonnements et la scène 3D
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initScene() {
    // Création de la scène
    this.scene = new THREE.Scene();

    // Création de la caméra
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Création du renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.nativeElement.appendChild(this.renderer.domElement);

    // Création du ciel
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      side: THREE.BackSide
    });
    this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skybox);

    // Création des nuages
    this.createClouds();

    // Gestion du redimensionnement
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private createClouds() {
    const cloudGeometry = new THREE.SphereGeometry(1, 8, 8);
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.8
    });

    // Création de plusieurs nuages
    for (let i = 0; i < 20; i++) {
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 100
      );
      cloud.scale.set(
        Math.random() * 2 + 1,
        Math.random() * 2 + 1,
        Math.random() * 2 + 1
      );
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }
  }

  private updateView(data: any) {
    // Mise à jour de la couleur du ciel en fonction de l'altitude
    const altitude = data.altitude;
    const skyColor = new THREE.Color();
    if (altitude < 10000) {
      skyColor.setRGB(0.53, 0.81, 0.92); // Bleu clair
    } else if (altitude < 20000) {
      skyColor.setRGB(0.33, 0.61, 0.92); // Bleu moyen
    } else {
      skyColor.setRGB(0.13, 0.41, 0.92); // Bleu foncé
    }
    (this.skybox.material as THREE.MeshBasicMaterial).color = skyColor;

    // Mise à jour de la position des nuages
    this.clouds.forEach(cloud => {
      cloud.position.x += Math.random() * 0.1 - 0.05;
      cloud.position.y += Math.random() * 0.1 - 0.05;
      cloud.position.z += Math.random() * 0.1 - 0.05;

      // Réinitialiser la position si trop loin
      if (cloud.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 100) {
        cloud.position.set(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 100
        );
      }
    });
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
} 