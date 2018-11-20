# The Sphere of My Influence
###### Concept [Stephanie Geerlings](https://twitter.com/geerlinger) Implementation [Robert Harris](https://twitter.com/trebor)


### About
[**The Sphere of My Influence**](http://trebor.github.io/tsomi/) is a tool for exploring people on Wikipedia, and how they influece each other.  [The visualization](http://trebor.github.io/tsomi/) starts at Joice Carol Oates by default, however an alternate starting point can be specified by appending `?subject=Wikipedia_Name` to the URL.  For example:

  - [Albert Einstein](http://trebor.github.io/tsomi/?subject=Albert_Einstein)
  - [Joni Mitchell](http://trebor.github.io/tsomi/?subject=Joni_Mitchell)
  - [Teresa of Ávila](http://trebor.github.io/tsomi/?subject=Teresa_of_Ávila)
  - [Immanuel Kant](http://trebor.github.io/tsomi/?subject=Immanuel_Kant)

### Data
The data for this visualization comes from [Wikipedia](http://wikipedia.org) by way of [DBpedia](http://dbpedia.org).

### Future
This project is fairly bare bones, and could use some love.  Some ideas for future features:

  - Search
  - Better Documentation
  - URL update to current subject

This project is opensourced under the [MIT License](http://opensource.org/licenses/MIT).  Your contributions are encouraged, please clone and fork.

# Development

**Branch from `staging` for all development.**

The development environment requires only a current version of Node. If using the Nix package manager, the `shell.nix` file will install node 8.11.1 and npm 5.6.0 directly from the NodeJS website.

Get a complete build with `npm run build`. Get a development continuous rebuild with `npm run dev`. The build is available in a local browser at `file:///path-to-repository/index.html`.

This project uses [Jasmine](https://jasmine.github.io/2.0/introduction.html) in a Node server to run tests and [Flow](https://flow.org/en/) for type checking.

# Cloud City Deployment

Staging: The [staging application](http://tsomi-staging.cloudcity.io/) lives in the [staging repository](https://github.com/cloudcity/tsomi-staging). Commits to staging are automatically pushed to that repository and deployed.

Production: The [production application](http://tsomi.cloudcity.io/) lives in the `gh-pages` branch of the repository. Do not commit directly to that branch. Commits to master will be automatically built and pushed to `gh-pages`.

Old note (possibly no longer relevant?): Go to Travis and select "More Options > Trigger Build". This will cause a build, merge, and commit of the final result in `gh-pages` and a deployment to staging within a few minutes.

