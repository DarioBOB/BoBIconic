import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OngoingFlightService } from '../../services/ongoing-flight.service';
import { TranslationService } from '../../services/translation.service';
import { LoggerService } from '../../services/logger.service';

interface FlightInfo {
  flightNumber: string;
  departure: string;
  arrival: string;
  status: string;
  aircraft: string;
  departureTime: string;
  arrivalTime: string;
}

interface DynamicData {
  altitude: number;
  speed: number;
  weather: string;
  phase: string;
}

@Component({
  selector: 'app-window2',
  templateUrl: './window2.page.html',
  styleUrls: ['./window2.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class Window2Page implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('hublotCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Three.js components
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock = new THREE.Clock();

  // Cloud system
  private cloudGroups: THREE.Group[] = [];
  private cloudTexture!: THREE.Texture;
  private wind = new THREE.Vector2(0.1, 0.05);

  // Flight data
  flightInfo: FlightInfo = {
    flightNumber: 'AF123',
    departure: 'Paris CDG',
    arrival: 'New York JFK',
    status: 'En vol',
    aircraft: 'Airbus A350',
    departureTime: '10:00',
    arrivalTime: '13:00'
  };

  dynamicData: DynamicData = {
    altitude: 35000,
    speed: 850,
    weather: 'Dégagé',
    phase: 'Croisière'
  };

  // UI state
  selectedTab = 'hublot';
  currentPercent = 50;

  constructor(
    private ongoingFlightService: OngoingFlightService,
    private translationService: TranslationService,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.loadFlightData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initThreeScene();
      this.animate();
    }, 100);
  }

  ngOnDestroy() {
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private loadFlightData() {
    const ongoingFlight = this.ongoingFlightService.getOngoingFlight();
    if (ongoingFlight) {
      this.flightInfo = {
        flightNumber: ongoingFlight.flightNumber || 'AF123',
        departure: ongoingFlight.departure || 'Paris CDG',
        arrival: ongoingFlight.arrival || 'New York JFK',
        status: 'En vol',
        aircraft: 'Airbus A350',
        departureTime: '10:00',
        arrivalTime: '13:00'
      };
    }
  }

  private initThreeScene() {
    if (!this.canvasRef?.nativeElement) {
      console.error('Canvas element not found');
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 600;

    console.log('Initializing Three.js scene with dimensions:', width, 'x', height);

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87CEEB, 100, 1000);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
    this.camera.position.set(0, 50, 100);
    this.camera.lookAt(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: canvas, 
      antialias: true, 
      alpha: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x87CEEB, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    this.setupLighting();

    // Skybox
    this.createSkybox();

    // Ground plane
    this.createGroundPlane();

    // Cloud system
    this.createCloudTexture();
    this.createCloudClusters();

    console.log('Three.js scene initialized successfully');
  }

  private setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    this.scene.add(directionalLight);
  }

  private createSkybox() {
    // Simple skybox using a large sphere
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);
  }

  private createGroundPlane() {
    // Create a simple ground plane
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x228B22,
      transparent: true,
      opacity: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -50;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private createCloudTexture() {
    // Create cloud texture programmatically
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Clear canvas
    ctx.clearRect(0, 0, 256, 256);

    // Create gradient for cloud shape
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    // Draw multiple cloud shapes
    for (let i = 0; i < 5; i++) {
      const x = 128 + (Math.random() - 0.5) * 100;
      const y = 128 + (Math.random() - 0.5) * 100;
      const radius = 30 + Math.random() * 40;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Create texture from canvas
    this.cloudTexture = new THREE.CanvasTexture(canvas);
    this.cloudTexture.needsUpdate = true;
  }

  private createCloudClusters() {
    // Create multiple cloud clusters
    for (let cluster = 0; cluster < 8; cluster++) {
      const cloudGroup = new THREE.Group();
      
      // Create 4-8 sprites per cluster for volume effect
      const spriteCount = 4 + Math.floor(Math.random() * 4);
      
      for (let i = 0; i < spriteCount; i++) {
        const spriteMaterial = new THREE.SpriteMaterial({
          map: this.cloudTexture,
          transparent: true,
          opacity: 0.7 + Math.random() * 0.3,
          depthWrite: false
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        
        // Position within cluster
        sprite.position.set(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 40
        );

        // Vary scale for volume effect
        const scale = 15 + Math.random() * 20;
        sprite.scale.set(scale, scale * 0.6, 1);

        cloudGroup.add(sprite);
      }

      // Position cluster in scene
      cloudGroup.position.set(
        (Math.random() - 0.5) * 400,
        50 + Math.random() * 100,
        (Math.random() - 0.5) * 400
      );

      this.scene.add(cloudGroup);
      this.cloudGroups.push(cloudGroup);
    }
  }

  private animate() {
    if (!this.renderer || !this.scene || !this.camera) {
      console.error('Missing Three.js components for animation');
      return;
    }

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Animate clouds
    this.animateClouds(delta, elapsed);

    // Render
    this.renderer.render(this.scene, this.camera);

    // Continue animation loop
    requestAnimationFrame(() => this.animate());
  }

  private animateClouds(delta: number, elapsed: number) {
    this.cloudGroups.forEach((group, index) => {
      // Move clouds with wind
      group.position.x += this.wind.x * delta * 20;
      group.position.z += this.wind.y * delta * 20;

      // Wrap around when clouds go too far
      if (group.position.x > 300) group.position.x = -300;
      if (group.position.x < -300) group.position.x = 300;
      if (group.position.z > 300) group.position.z = -300;
      if (group.position.z < -300) group.position.z = 300;

      // Subtle rotation for life effect
      group.rotation.y += delta * 0.1;

      // Vary opacity slightly
      group.children.forEach((sprite, spriteIndex) => {
        if (sprite instanceof THREE.Sprite) {
          const material = sprite.material as THREE.SpriteMaterial;
          material.opacity = 0.6 + Math.sin(elapsed + index + spriteIndex) * 0.2;
        }
      });
    });
  }

  // UI Methods
  onTabChange(event: any) {
    this.selectedTab = event.detail.value;
  }

  onProgressChange(event: any) {
    this.currentPercent = event.detail.value;
    this.updateFlightData();
  }

  private updateFlightData() {
    // Update dynamic data based on flight progression
    const progress = this.currentPercent / 100;
    
    if (progress < 0.2) {
      this.dynamicData.phase = 'Décollage';
      this.dynamicData.altitude = 5000 + progress * 15000;
    } else if (progress < 0.8) {
      this.dynamicData.phase = 'Croisière';
      this.dynamicData.altitude = 35000;
    } else {
      this.dynamicData.phase = 'Atterrissage';
      this.dynamicData.altitude = 35000 - (progress - 0.8) * 175000;
    }

    this.dynamicData.speed = 800 + Math.sin(progress * Math.PI) * 100;
  }

  getCurrentTime(): string {
    const startTime = new Date(`2024-01-01T${this.flightInfo.departureTime}:00`);
    const endTime = new Date(`2024-01-01T${this.flightInfo.arrivalTime}:00`);
    const totalDuration = endTime.getTime() - startTime.getTime();
    const currentTime = startTime.getTime() + (totalDuration * this.currentPercent / 100);
    
    return new Date(currentTime).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}