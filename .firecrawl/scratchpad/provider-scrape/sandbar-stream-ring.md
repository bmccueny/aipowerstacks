[![logo](https://www.sandbar.ai/logo.svg)\\
**Sandbar**](https://www.sandbar.ai/)

# All-in-one, self-service AML screening

The most complete, configurable, and autonomous AML system. Buy one, two, or all three components. Get started in as little as 10 minutes on your own or book a demo to learn more.

[Start screening](https://app.sandbar.ai/?ref=website-hero-button) [Book a demo](https://www.sandbar.ai/contact)

![Autonomous AML Screening Platform](https://www.sandbar.ai/hero.svg)

![Gusto](https://www.sandbar.ai/gusto_logo.png)![Rho](https://www.sandbar.ai/rho_logo.png)![Salsa](https://www.sandbar.ai/salsa_logo.png)![Papaya](https://www.sandbar.ai/papaya_logo.png)![Kanmon](https://www.sandbar.ai/kanmon_logo.png)![AutoPayPlus](https://www.sandbar.ai/autopayplus_logo.png)![Benny](https://www.sandbar.ai/benny_logo.png)![Plane](https://www.sandbar.ai/plane_logo.png)

![Full Stack icon](https://www.sandbar.ai/layers-3.png)

## Full Stack

# Everything You Need

Pick the right modules to fit your business: our best-in-class data, most configurable engine, or highly autonomous alert management system: all available through one API any engineer can integrate.

![Data](https://www.sandbar.ai/data.svg)

Data

Global coverage: 500+ sources, 275+ countries, & BYOData.

![Engine](https://www.sandbar.ai/engine.svg)

Engine

Segment customers, configure rules, and apply suppression.

![Interface](https://www.sandbar.ai/interface_2.svg)

Interface

Assign, escalate, and document work across your team.

![3 Steps icon](https://www.sandbar.ai/list-checks.png)

## 3 Steps

# 10 Minutes to Compliance

1

## Sign up

No commitment or credit card required to get started and see the application and start screening against latest lists.

![Data Integration](https://www.sandbar.ai/sso.svg)

2

## Upload your customers

Via API, CSV upload, manual input, we handle it all.

![Custom Configuration](https://www.sandbar.ai/questions.svg)

3

## Create your rule and screen

Select your lists, sources and thresholds to start seeing results.

![Scale Your Business](https://www.sandbar.ai/interface_2.svg)

## Pricing

Sign up and start screening for free to start using our data, setting up rules, uploading customers and working alerts with the help of our AI summaries and more.

Starting at

$500/month

With a 14-day and 5,000 screen free trial

[TRY FOR FREE](https://app.sandbar.ai/?ref=website-pricing-button)

No credit card required.

What's included in the plan

- OpenSanctions data
- Configurable rules
- Case management
- AI Summaries
- Performance metrics
- Data exports

![Matt](https://www.sandbar.ai/api/media/file/Featuring%2064x64%20Plane.png)

Matt

Founder & CEO at Plane

“It only took one engineer two days to integrate Sandbar. Since going live, they have consistently produced better results for less, dramatically improving operational productivity by removing redundant alerts and optimizing alert accuracy.”

[View case study](https://www.sandbar.ai/case-studies/plane)

## Get compliant today.

[Start screening](https://app.sandbar.ai/?ref=website-cta-button)

# Most configurable engine

Your AML system, your way––we give you all the ingredients you need to create the best AML screening program you can imagine.

01

Segmentation

Choose which population to apply what rules and when.

![placeholder](https://www.sandbar.ai/segmentation.svg)

02

Rule logic

From the fuzzy logic to the sensitivity and much more.

![placeholder](https://www.sandbar.ai/rule_logic.svg)

03

Alert filters

Apply endless filters like DOB, location, and NAICS––per rule.

![placeholder](https://www.sandbar.ai/suppression.svg)

# AI Native interface

[Book a demo](https://www.sandbar.ai/contact)

Controlled, human-in-the-loop autonomy at your fingertips––from AI summaries to decisions, EDD research, OSINT tools, CRR models, and entire AML analysts-in-a-box, handle more volume with less.

![placeholder](https://www.sandbar.ai/ai_qc_widget_design.svg)

![placeholder](https://www.sandbar.ai/ai_aml_widget.svg)

![placeholder](https://www.sandbar.ai/ai_summaries_widget_design.svg)

![placeholder](https://www.sandbar.ai/ai_decisions_widget.svg)

![placeholder](https://www.sandbar.ai/ai_chatbot_metric_widget_design.svg)

![placeholder](https://www.sandbar.ai/ai_edd_widget.svg)

![placeholder](https://www.sandbar.ai/ai_crr_widget.svg)

![placeholder](https://www.sandbar.ai/ai_risk_assessment_widget.svg)

![placeholder](https://www.sandbar.ai/ai_system_tuning_widget.svg)

# The best AML teams using Sandbar

![Gusto](https://www.sandbar.ai/gusto_logo.png)

![Rho](https://www.sandbar.ai/rho_logo.png)

![Salsa](https://www.sandbar.ai/salsa_logo.png)

![Kanmon](https://www.sandbar.ai/kanmon_logo.png)

![AutoPayPlus](https://www.sandbar.ai/autopayplus_logo.png)

![Benny](https://www.sandbar.ai/benny_logo.png)

##### We integrated Sandbar in two days; they were able to respond quickly and give us the support we needed to onboard to a new bank partner within days.

Plane, CEO

![Company logo](https://www.sandbar.ai/plane_logo_color.png)

##### Sandbar is a true partner to our AML practice––they've helped us through some tough times and we came out stronger because they were there for us.

Papaya, CCO

![Company logo](https://www.sandbar.ai/papaya_logo_color.png)

## One API call.  LLM-friendly documentation.

Start sending and screening data today across 500+ sources and 250+ countries in real-time. On call support available.

[Documentation](https://www.sandbar.ai/docs)

TypescriptPythonGo

create-customer.ts

Copy

```
async function createCustomer() {
  	const response = await fetch("https://api.sandbar.ai/v1/customers", {
  		method: "POST",
  		headers: {
  			"Content-Type": "application/json",
  			"Authorization": "Bearer YOUR_API_KEY",
  		},
  		body: JSON.stringify({
  			source_id: "PERSON-67890",
  			type: "person",
  			name: "John Smith",
  			addresses: [\
  				{\
  					street: "456 Oak Avenue",\
  					city: "New York",\
  					state: "NY",\
  					postalCode: "10001",\
  					region: "New York",\
  					postOfficeBox: "",\
  					country: "US",\
  				},\
  			],
  			emails: ["john.smith@email.com"],
  			phones: ["+1-212-555-0198"],
  			birth_date: "1985-07-22",
  		}),
  	});

  	if (!response.ok) {
  		throw new Error(`HTTP error! status: ${response.status}`);
  	}

  	const customer = await response.json();
  	return customer;
  }
```

### Self service

[Start screeningStart](https://app.sandbar.ai/?ref=website-cta-button)

![Self service](https://www.sandbar.ai/self_service_3.svg)

### Enterprise sales

[Book a demoBook](https://www.sandbar.ai/contact)

![Enterprise sales](https://www.sandbar.ai/enterprise_sales_3.svg)

Don't let us slow you down from setting up and scaling your AML screening program today but we're here for you if you need us.

# Custom autonomy at scale

![Card 1](https://www.sandbar.ai/lists_widget_3.svg)

![Card 2](https://www.sandbar.ai/clients_widget_3.svg)

![Card 3](https://www.sandbar.ai/ai_widget_3.svg)

![Card 1](https://www.sandbar.ai/lists_widget_3.svg)

![Card 2](https://www.sandbar.ai/clients_widget_3.svg)

![Card 3](https://www.sandbar.ai/ai_widget_3.svg)

![Card 4](https://www.sandbar.ai/all_in_one_widget_3.svg)

![Card 5](https://www.sandbar.ai/ai_chatbot_widget_3.svg)

![Card 6](https://www.sandbar.ai/all_you_need_widget_3.svg)

![Card 7](https://www.sandbar.ai/chart_widget_3.svg)

All the knobs, dials, and levers you always wanted internally but never had the budget or resources for.

[Start screening](https://app.sandbar.ai/?ref=website-cta-button) [See a demo](https://www.sandbar.ai/contact)