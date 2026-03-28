SparkVSR

# Interactive Video Super-Resolution via Sparse Keyframe Propagation

[Jiongze Yu1](https://sparkvsr.github.io/#) [Xiangbo Gao1](https://sparkvsr.github.io/#) [Pooja Verlani2](https://sparkvsr.github.io/#) [Akshay Gadde2](https://sparkvsr.github.io/#) [Yilin Wang2](https://sparkvsr.github.io/#) [Balu Adsumilli2](https://sparkvsr.github.io/#) [Zhengzhong Tu†,1](https://sparkvsr.github.io/#)

1Texas A&M University    2YouTube, Google


† Corresponding author

[Paper](https://arxiv.org/abs/2603.16864) [Code](https://github.com/taco-group/SparkVSR) [Model](https://huggingface.co/JiongzeYu/SparkVSR)

![SparkVSR Overall Inference Framework](https://sparkvsr.github.io/inference_pipeline_1.png)

**Overall inference framework of SparkVSR.** The pipeline consists
of three main stages: (1) Keyframe Selection: LR keyframes are extracted using manual, I-frame, or
random sampling strategies; (2) HR Reference Generation: Selected frames are upscaled into HR
reference keyframes via an interactive (task/content prompt-guided) or blind ISR model; (3)
Conditional Video Reconstruction: A Diffusion Transformer-based VSR model fuses the HR keyframe and LR
video latents to guide the generation of the final HR video.

Featured Demo

## SparkVSR Video Demonstration

Demo Preview

## Abstract

Video Super-Resolution (VSR) aims to restore high-quality video frames from low-resolution (LR)
estimates, yet most existing VSR approaches behave like black boxes at inference time: users cannot
reliably correct unexpected artifacts, but instead can only accept whatever the model produces.
In this paper, we propose a novel interactive VSR framework dubbed SparkVSR that makes sparse keyframes
a simple and expressive control signal. Specifically, users can first super-resolve or optionally a
small set of keyframes using any off-the-shelf image super-resolution (ISR) model, then SparkVSR
propagates the keyframe priors to the entire video sequence while remaining grounded by the original LR
video motion.
Concretely, we introduce a keyframe-conditioned latent-pixel two-stage training pipeline that fuses LR
video latents with sparsely encoded HR keyframe latents to learn robust cross-space propagation and
refine perceptual details. At inference time, SparkVSR supports flexible keyframe selection (manual
specification, codec I-frame extraction, or random sampling) and a reference-free guidance mechanism
that continuously balances keyframe adherence and blind restoration, ensuring robust performance even
when reference keyframes are absent or imperfect. Experiments on multiple VSR benchmarks demonstrate
improved temporal consistency and strong restoration quality, surpassing baselines by up to 24.6%,
21.8%, and 5.6% on CLIP-IQA, DOVER, and MUSIQ, respectively, enabling controllable, keyframe-driven
video super-resolution.
Moreover, we demonstrate that SparkVSR is a generic interactive, keyframe-conditioned video processing
framework as it can be applied out of the box to unseen tasks such as old-film restoration and video
style transfer.


## Method

![SparkVSR Pipeline](https://sparkvsr.github.io/training_pipeline_1.png)

**Keyframe-conditioned two-stage training pipeline of SparkVSR.** (1) Stage 1 (Latent
Space Training): Augmented HR keyframe latents are concatenated with LR video latents to optimize
the Diffusion Transformer using Lmse. (2) Stage 2 (Pixel Space Training): A joint
video-image training mechanism is employed. The video branch is conditioned on HR keyframe latents,
while the image branch uses a zero latent. Finally, outputs are decoded by the VAE and refined in
the pixel space using mixed losses.


## Visual Results

Swipe or use arrows to browse more results in each category

### 🌿 Natural Scene Video SR

‹›

Input

Ours

Clip 4

Input

Ours

Clip 5

Input

Ours

Clip 1

Input

Ours

Clip 2

Input

Ours

Clip 3

Input

Ours

Clip 4

Input

Ours

Clip 5

Input

Ours

Clip 1

Input

Ours

Clip 2

### 🏙️ Urban Scene Video SR

‹›

Input

Ours

Clip 4

Input

Ours

Clip 5

Input

Ours

Clip 1

Input

Ours

Clip 2

Input

Ours

Clip 3

Input

Ours

Clip 4

Input

Ours

Clip 5

Input

Ours

Clip 1

Input

Ours

Clip 2

### 🎬 Old Movie Restoration

‹›

Input

Ours

Clip 4

Input

Ours

Clip 5

Input

Ours

Clip 1

Input

Ours

Clip 2

Input

Ours

Clip 3

Input

Ours

Clip 4

Input

Ours

Clip 5

Input

Ours

Clip 1

Input

Ours

Clip 2

### 🤖 AIGC Video SR

‹›

Input

Ours

Clip 4

Input

Ours

Clip 5

Input

Ours

Clip 1

Input

Ours

Clip 2

Input

Ours

Clip 3

Input

Ours

Clip 4

Input

Ours

Clip 5

Input

Ours

Clip 1

Input

Ours

Clip 2

💡 Drag the slider left/right to compare input and super-resolution result. Use arrows
to browse more clips.

[View\\
More Comparison Results →](https://sparkvsr.github.io/comparison.html)

## BibTeX

Copy


```
@misc{yu2026sparkvsrinteractivevideosuperresolution,
      title={SparkVSR: Interactive Video Super-Resolution via Sparse Keyframe Propagation},
      author={Jiongze Yu and Xiangbo Gao and Pooja Verlani and Akshay Gadde and Yilin Wang and Balu Adsumilli and Zhengzhong Tu},
      year={2026},
      eprint={2603.16864},
      archivePrefix={arXiv},
      primaryClass={cs.CV},
      url={https://arxiv.org/abs/2603.16864},
}
```