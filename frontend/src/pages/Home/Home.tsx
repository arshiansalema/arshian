import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Shield, Zap, Users, CheckCircle } from 'lucide-react';
import HeroSection from './components/HeroSection';
import FeaturedProducts from './components/FeaturedProducts';
import CompanyStats from './components/CompanyStats';
import WhyChooseUs from './components/WhyChooseUs';
import Testimonials from './components/Testimonials';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <HeroSection />
      <FeaturedProducts />
      <CompanyStats />
      <WhyChooseUs />
      <Testimonials />
      
      {/* CTA Section */}
      <section className="section-padding bg-primary-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Contact us today to discuss your pump requirements and get a customized solution
            that meets your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="btn bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg"
            >
              Get Quote Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/products"
              className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 text-lg"
            >
              View Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;