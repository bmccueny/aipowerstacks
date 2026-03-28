# ![](https://depth-anything.github.io/static/images/logo.png) Depth Anything

# Unleashing the Power of Large-Scale Unlabeled Data

[Lihe Yang](https://liheyoung.github.io/) 1[Bingyi Kang](https://scholar.google.com/citations?user=NmHgX-wAAAAJ) 2†[Zilong Huang](http://speedinghzl.github.io/) 2[Xiaogang Xu](https://xiaogang00.github.io/) 3,4[Jiashi Feng](https://sites.google.com/site/jshfeng/) 2[Hengshuang Zhao](https://hszhao.github.io/) 1\*

1HKU              2TikTok              3CUHK4ZJU

† project lead\\* corresponding author

**CVPR 2024**

[arXiv](https://arxiv.org/abs/2401.10891)[Paper](https://arxiv.org/pdf/2401.10891.pdf)[Code](https://github.com/LiheYoung/Depth-Anything)[Demo](https://huggingface.co/spaces/LiheYoung/Depth-Anything)[Model](https://huggingface.co/spaces/LiheYoung/Depth-Anything/tree/main)

![](https://depth-anything.github.io/static/images/teaser.png)

#### Depth Anything is trained on 1.5M labeled images and **62M+ unlabeled images** jointly, providing the most capable Monocular Depth Estimation (MDE) foundation models with the following features:      - zero-shot **relative** depth estimation, better than MiDaS v3.1 (BEiTL-512) - zero-shot **metric** depth estimation, better than ZoeDepth - optimal in-domain fine-tuning and evaluation on NYUv2 and KITTI    We also upgrade **a better depth-conditioned ControlNet** based on our Depth Anything.

## Comparison between Depth Anything and MiDaS v3.1

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/sa1b_demo2.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/sa1b_demo3.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo7.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo15.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo8.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/sa1b_demo1.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo16.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo9.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo4.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo10.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo11.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo12.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo13.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo14.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/sa1b_demo2.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/sa1b_demo3.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo7.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo15.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo8.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/sa1b_demo1.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo16.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo9.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo4.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo10.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo11.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo12.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo13.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo14.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/sa1b_demo2.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/sa1b_demo3.png)

![Steve GIF](https://depth-anything.github.io/static/images/compare_depth_image/demo7.png)

## Please zoom in for better visualization on some darker (very distant) areas.

## Better Depth Model Brings Better ControlNet

We **re-train** a depth-conditioned ControlNet based on our Depth Anything, better than the previous one based on MiDaS.


![Steve GIF](https://depth-anything.github.io/static/images/controlnet/demo3.png)

![Steve GIF](https://depth-anything.github.io/static/images/controlnet/demo2.png)

![Steve GIF](https://depth-anything.github.io/static/images/controlnet/demo3.png)

![Steve GIF](https://depth-anything.github.io/static/images/controlnet/demo2.png)

![Steve GIF](https://depth-anything.github.io/static/images/controlnet/demo3.png)

![Steve GIF](https://depth-anything.github.io/static/images/controlnet/demo2.png)

![Steve GIF](https://depth-anything.github.io/static/images/controlnet/demo3.png)

## Depth Visualization on Videos

**Note:** Depth Anything is an image-based depth estimation method, we use video demos just to better exhibit our superiority. For more image-level visualizations, please refer to our paper.


## Depth Anything for Video Editing

**We thank the [MagicEdit](https://github.com/magic-research/magic-edit) team for providing some video examples for video depth estimation, and [Tiancheng Shen](https://scholar.google.com/citations?user=iRY1YVoAAAAJ) for evaluating the depth maps with MagicEdit.** The middle video is generated by MiDaS-based ControlNet, while the last video is generated by Depth Anything-based ControlNet.


## Abstract

This work presents Depth Anything, a highly practical solution for robust monocular depth estimation. Without pursuing novel technical modules, we aim to build a simple yet powerful foundation model dealing with any images under any circumstances. To this end, we scale up the dataset by designing a data engine to collect and automatically annotate large-scale unlabeled data (~62M), which significantly enlarges the data coverage and thus is able to reduce the generalization error. We investigate two simple yet effective strategies that make data scaling-up promising. First, a more challenging optimization target is created by leveraging data augmentation tools. It compels the model to actively seek extra visual knowledge and acquire robust representations. Second, an auxiliary supervision is developed to enforce the model to inherit rich semantic priors from pre-trained encoders. We evaluate its zero-shot capabilities extensively, including six public datasets and randomly captured photos. It demonstrates impressive generalization ability. Further, through fine-tuning it with metric depth information from NYUv2 and KITTI, new SOTAs are set. Our better depth model also results in a much better depth-conditioned ControlNet. All models have been released.


## Data Coverage

Our Depth Anything is trained on a combination set of 6 labeled datasets (1.5M images) and **8 unlabeled datasets (62M+ images)**.


![pipeline](https://depth-anything.github.io/static/images/dataset.png)

## Zero-shot Relative Depth Estimation

Depth Anything is better than the previously best **relative** MDE model MiDaS v3.1.


![pipeline](https://depth-anything.github.io/static/images/compare_relative_MDE.png)\\* MiDaS is also trained on KITTI and NYUv2, while our Depth Anything is not.

## Zero-shot Metric Depth Estimation

Depth Anything is better than the previously best **metric** MDE model ZoeDepth.


![pipeline](https://depth-anything.github.io/static/images/compare_zeroshot_metric_MDE.png)

## In-domain Metric Depth Estimation

![pipeline](https://depth-anything.github.io/static/images/compare_indomain_nyu.png)
In-domain metric depth estimation on NYUv2.
![pipeline](https://depth-anything.github.io/static/images/compare_indomain_kitti.png)
In-domain metric depth estimation on KITTI.


## Transferring Our Encoder to Semantic Segmentation

![pipeline](https://depth-anything.github.io/static/images/compare_semseg_citys.png)
Transferring our Depth Anything pre-trained encoder to Cityscapes semantic segmentation.
![pipeline](https://depth-anything.github.io/static/images/compare_semseg_ade20k.png)
Transferring our Depth Anything pre-trained encoder to ADE20K semantic segmentation.


## Framework

The framework of Depth Anything is shown below. We adopt a standard pipeline to unleashing the power of large-scale unlabeled images.


![pipeline](https://depth-anything.github.io/static/images/pipeline.png)

## Citation

```
@inproceedings{depthanything,
  title={Depth Anything: Unleashing the Power of Large-Scale Unlabeled Data},
  author={Yang, Lihe and Kang, Bingyi and Huang, Zilong and Xu, Xiaogang and Feng, Jiashi and Zhao, Hengshuang},
  booktitle={CVPR},
  year={2024}
}
```