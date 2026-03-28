![Mobile-O Logo](https://amshaker.github.io/Mobile-O/assets/mobile-o-logo.png)

# Mobile-O

## Unified Multimodal Understanding and Generation on Mobile Device

Abdelrahman Shaker1,∗,†,
Ahmed Heakl1,∗,
Jaseel Muhammad1,
Ritesh Thawkar1,
Omkar Thawakar1,
Senmao Li1,


Hisham Cholakkal1,
Ian Reid1,
Eric P. Xing1,2,
Salman Khan1,†,
Fahad Shahbaz Khan1,3,†

1Mohamed bin Zayed University of Artificial Intelligence
2Carnegie Mellon University
3Linköping University


\*Equal Contributions   †Project Leaders


[Paper](https://arxiv.org/abs/2602.20161) [Code](https://github.com/Amshaker/Mobile-O) [🤗 Models](https://huggingface.co/collections/Amshaker/mobile-o-models) [🤗 Datasets](https://huggingface.co/collections/Amshaker/mobile-o-datasets) [Live Demo](https://mobileo.cvmbzuai.com/) [App Store](https://apps.apple.com/app/mobile-o/id6759238106)

1.6B

Total Parameters

~3s

Image Generation (iPhone)

~0.4s

Visual Understanding (iPhone)

<2GB

Memory Footprint

## Overview

Mobile-O is designed specifically for mobile and edge deployment. It combines a vision-language model with a diffusion-based image generator in a single unified architecture, enabling real-time multimodal understanding (VQA, OCR, reasoning) and high-quality image generation at 512×512 resolution — all with a memory footprint under 2GB.


**Key result:** Mobile-O generates 512×512 images in ~3 seconds and performs visual understanding in ~0.4 seconds on iPhone, with only 1.6B total parameters.


![Mobile-O Overview](https://amshaker.github.io/Mobile-O/assets/mobile-o-teaser.jpg)

## Capabilities

![Image Generation](https://amshaker.github.io/Mobile-O/assets/image_generation.gif)

### 🖼️ Image Generation

High-quality text-to-image synthesis at 512×512 resolution using a lightweight DiT decoder

![Image Understanding](https://amshaker.github.io/Mobile-O/assets/image_understanding.gif)

### 👁️ Image Understanding

Visual question answering, OCR, and multimodal reasoning powered by FastVLM

![Image Editing](https://amshaker.github.io/Mobile-O/assets/image_editing.gif)

### ✏️ Image Editing

Instruction-based image editing combining understanding and generation pipelines

💬
Text → Text


🖼️
Image → Text


✨
Text → Image


✏️
Text + Image → Image


🔄
Unified Training


## Architecture

![Mobile-O Architecture](https://amshaker.github.io/Mobile-O/assets/mobile-o-arch.jpg)

Overall architecture of Mobile-O: a unified vision–language–diffusion model for on-device multimodal understanding and generation.

#### Vision-Language Model

[FastVLM-0.5B](https://github.com/apple/ml-fastvlm) combining FastViT as vision encoder and Qwen2-0.5B as the autoregressive language backbone for multimodal understanding.

FastViT + Qwen2-0.5B

#### Diffusion Decoder

[SANA-600M-512](https://github.com/NVlabs/Sana), a lightweight linear DiT-style diffusion transformer paired with a VAE encoder-decoder for text-to-image generation at 512×512.

Linear DiT + VAE

#### Mobile Conditioning Projector

A novel lightweight connector (~2.4M params) bridging VLM and diffusion decoder using layerwise feature fusion with temperature-scaled learnable weights.

~2.4M Parameters

## Training Pipeline

1

#### Cross-Modal Alignment

Pretrain DiT and MCP on 9M text-image pairs. Visual encoders, LLM, and VAE are frozen.

[📦 9M pairs](https://huggingface.co/datasets/Amshaker/Mobile-O-Pre-Train)→

2

#### Supervised Fine-tuning

Finetune DiT and MCP on ~105K curated prompt-image pairs from BLIP3o + ShareGPT-4o.

[📦 ~105K pairs](https://huggingface.co/datasets/Amshaker/Mobile-O-SFT)→

3

#### Unified Post-Training

Post-train DiT, MCP, LLM (LoRA), and visual encoder on ~105K quadruplet samples.

[📦 ~105K quadruplets](https://huggingface.co/datasets/Amshaker/Mobile-O-SFT)

![Training Pipeline](https://amshaker.github.io/Mobile-O/assets/training_figure.jpg)

Unified multimodal post-training: jointly optimizing image generation and visual understanding via a multi-task objective.

## Mobile App

Mobile-O runs entirely on-device with no cloud dependency. We release the **full source code** of the iOS app along with optimized **MLX** and **CoreML** model components.


[![Download on the App Store](https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg)](https://apps.apple.com/app/mobile-o/id6759238106)

[📱\\
\\
iOS App Source Code\\
\\
Mobile-O-App](https://github.com/Amshaker/Mobile-O/tree/main/Mobile-O-App) [🧩\\
\\
MLX & CoreML Models\\
\\
🤗 HuggingFace](https://huggingface.co/Amshaker/Mobile-O-0.5B-iOS)

⚡ ~3s

Image Generation

👁️ ~0.4s

Visual Understanding

💾 <2GB

Memory Footprint

## Model Checkpoints

| Model | Total Params | Download |
| --- | --- | --- |
| **Mobile-O-0.5B** | 1.6B | [🤗 HuggingFace](https://huggingface.co/Amshaker/Mobile-O-0.5B) |
| **Mobile-O-1.5B** | 3.5B | [🤗 HuggingFace](https://huggingface.co/Amshaker/Mobile-O-1.5B) |
| **Mobile-O-0.5B-iOS** | iOS Components | [🤗 HuggingFace](https://huggingface.co/Amshaker/Mobile-O-0.5B-iOS) |

### 📦 Training Datasets

| Stage | Description | Download |
| --- | --- | --- |
| **Pre-training** | 9M text-image pairs (JourneyDB+BLIP3o-Pretrain-Short-Caption) | [🤗 HuggingFace](https://huggingface.co/datasets/Amshaker/Mobile-O-Pre-Train) |
| **SFT** | ~105K curated prompt-image pairs | [🤗 HuggingFace](https://huggingface.co/datasets/Amshaker/Mobile-O-SFT) |
| **Post-training** | ~105K unified quadruplet samples | [🤗 HuggingFace](https://huggingface.co/datasets/Amshaker/Mobile-O-Post-Train) |

## Qualitative Results

✨

### Mobile-O Samples

Qualitative examples of understanding, generation, and editing from Mobile-O

![Qualitative Results](https://amshaker.github.io/Mobile-O/assets/mobile-o-qualitative.jpg)

🖼️

### Generation Results

Extended qualitative generation samples from Mobile-O

![Generation Results](https://amshaker.github.io/Mobile-O/assets/suppl_qualitative_generation.png)

⚔️

### Generation Comparison

Side-by-side generation comparison with other models

![Generation Comparison](https://amshaker.github.io/Mobile-O/assets/suppl_generation_comparison.png)

🔍

### Understanding Comparison

Side-by-side understanding comparison with other models

![Understanding Comparison](https://amshaker.github.io/Mobile-O/assets/suppl_qualitative_understanding_comparison.png)

## Quick Start

Install

conda create -n mobileo python=3.12 -y
conda activate mobileo
pip install -r requirements.txt


Download Checkpoint

python -c "from huggingface\_hub import snapshot\_download; print(snapshot\_download(repo\_id='Amshaker/Mobile-O-0.5B', repo\_type='model', local\_dir='checkpoints', allow\_patterns=\['final\_merged\_model\_23620/\*'\]))"

Image Understanding

python infer\_und.py --model\_path /path/to/checkpoint/ --image\_path assets/cute\_cat.png --prompt"What is in the image?"

Image Generation

python infer\_gen.py --model\_path /path/to/checkpoint/ --prompt"A vibrant tropical rainforest scene with a scarlet macaw perched on a moss-covered branch"

Image Editing

python infer\_edit.py --model\_path /path/to/checkpoint/ --image\_path assets/cute\_cat.png --prompt"Make the cat wear a hat"

## Citation

Copy


```
@article{shaker2026mobileo,
  title={Mobile-O: Unified Multimodal Understanding and Generation on Mobile Device},
  author={Shaker, Abdelrahman and Heakl, Ahmed and Muhammad, Jaseel and Thawkar, Ritesh and Thawakar, Omkar and Li, Senmao and Cholakkal, Hisham and Reid, Ian and Xing, Eric P. and Khan, Salman and Khan, Fahad Shahbaz},
  journal={arXiv preprint arXiv:2602.20161},
  year={2026}
}
```

## Acknowledgements

This repo is partially built upon [BLIP3o](https://github.com/JiuhaiChen/BLIP3o). Thanks to all the contributors for their great efforts.


## License

⚠️

This project is released under a **non-commercial research license**. The code, models, datasets, and app are intended **solely for academic and research purposes**. Please refer to the [LICENSE](https://amshaker.github.io/Mobile-O/LICENSE) file for full details.