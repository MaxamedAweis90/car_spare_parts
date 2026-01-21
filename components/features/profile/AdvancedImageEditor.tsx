"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Slider, Button, Space, Typography } from "antd";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateRightOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface AdvancedImageEditorProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export const AdvancedImageEditor: React.FC<AdvancedImageEditorProps> = ({
  image,
  onCropComplete,
  onCancel,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onRotationChange = (rotation: number) => {
    setRotation(rotation);
  };

  const onCropCompleteInternal = useCallback(
    (_croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0,
  ): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return null;
    }

    const rotRad = (rotation * Math.PI) / 180;
    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation,
    );

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // translate canvas context to a central point to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    // draw rotated image
    ctx.drawImage(image, 0, 0);

    // croppedAreaPixels values are bounding box relative
    // extract the cropped image using these values
    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
    );

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // paste generated rotate image with correct offsets for x,y crop values.
    ctx.putImageData(data, 0, 0);

    // As Base64 string
    // return canvas.toDataURL('image/jpeg');

    // As a blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((file) => {
        resolve(file);
      }, "image/jpeg");
    });
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = (rotation * Math.PI) / 180;

    return {
      width:
        Math.abs(Math.cos(rotRad) * width) +
        Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) +
        Math.abs(Math.cos(rotRad) * height),
    };
  };

  const showCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(
        image,
        croppedAreaPixels,
        rotation,
      );
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden">
      <div className="relative w-full h-80 bg-slate-900 overflow-hidden">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
        />
      </div>

      <div className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <ZoomOutOutlined className="text-slate-400" />
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={onZoomChange}
              className="flex-1"
              tooltip={{ open: false }}
            />
            <ZoomInOutlined className="text-slate-400" />
          </div>

          <div className="flex items-center gap-4">
            <RotateRightOutlined
              className="text-slate-400 cursor-pointer hover:text-blue-500 transition-colors"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            />
            <Slider
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={onRotationChange}
              className="flex-1"
              tooltip={{ open: false }}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            size="large"
            block
            className="h-12 border-slate-200 text-slate-600 font-bold rounded-xl"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            block
            className="h-12 font-bold rounded-xl shadow-lg shadow-blue-200"
            onClick={showCroppedImage}
          >
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
};
